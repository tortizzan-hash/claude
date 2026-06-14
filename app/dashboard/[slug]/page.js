'use client';

import { useEffect, useState, use } from 'react';

const BAND_STYLES = {
  green: 'bg-band-green/15 text-band-green border-band-green/40',
  yellow: 'bg-band-yellow/15 text-gold border-band-yellow/40',
  orange: 'bg-band-orange/15 text-band-orange border-band-orange/40',
  red: 'bg-band-red/15 text-band-red border-band-red/40',
};

export default function Dashboard({ params }) {
  const { slug } = use(params);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  async function load() {
    const res = await fetch(`/api/leads/${slug}`);
    const data = await res.json();
    if (data.ok) setLeads(data.leads);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000); // live-ish refresh for audits
    return () => clearInterval(t);
  }, [slug]);

  const sorted = [...leads].sort((a, b) => b.lqs - a.lqs);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex items-baseline justify-between border-b border-panel2 pb-4 mb-6">
        <div>
          <p className="label-mono">Vector Mode Legal · Client Portal</p>
          <h1 className="font-serif text-3xl mt-1">Lead Intelligence</h1>
        </div>
        <div className="text-right text-sm text-gray-400">
          <div>{leads.length} leads</div>
          <div className="text-band-green">
            {leads.filter((l) => l.band === 'high').length} high-signal
          </div>
        </div>
      </header>

      {loading ? (
        <p className="text-gray-500">Loading leads…</p>
      ) : sorted.length === 0 ? (
        <EmptyState slug={slug} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {sorted.map((lead) => (
              <LeadRow key={lead.id} lead={lead} onClick={() => setSelected(lead)} active={selected?.id === lead.id} />
            ))}
          </div>
          <div className="lg:col-span-1">
            {selected ? <LeadDetail lead={selected} /> : (
              <div className="rounded-lg border border-panel2 bg-panel p-6 text-gray-500 text-sm">
                Select a lead to see the full LQS breakdown.
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function LeadRow({ lead, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border bg-panel p-4 transition hover:border-gold/50 ${
        active ? 'border-gold' : 'border-panel2'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="font-serif text-lg">
          {lead.contact?.name || 'Anonymous inquiry'}
          {lead.practiceArea && <span className="text-gray-500 text-sm"> · {lead.practiceArea}</span>}
        </div>
        <ScorePill lead={lead} />
      </div>
      <p className="text-gray-400 text-sm mt-1 line-clamp-1">{lead.message}</p>
      <div className="flex items-center gap-2 mt-2">
        <Badge color={lead.color}>{lead.label}</Badge>
        {lead.forceReview && <Badge color="orange">⚑ Override: review</Badge>}
        <span className="text-xs text-gray-500">{lead.action}</span>
      </div>
    </button>
  );
}

function LeadDetail({ lead }) {
  const subs = [
    ['ISS', 'Inquiry Signal', lead.subscores.iss],
    ['CFS', 'Case Fit', lead.subscores.cfs],
    ['BIS', 'Buyer Intent', lead.subscores.bis],
    ['FRS', 'Firm Readiness', lead.subscores.frs],
    ['CRS', 'Conversion Resistance', lead.subscores.crs],
  ];
  return (
    <div className="rounded-lg border border-panel2 bg-panel p-5 sticky top-6">
      <div className="flex items-center justify-between mb-4">
        <p className="label-mono">LQS Breakdown</p>
        <ScorePill lead={lead} big />
      </div>
      <div className="space-y-3">
        {subs.map(([code, name, val]) => (
          <div key={code}>
            <div className="flex justify-between text-sm mb-1">
              <span><span className="font-mono text-gold">{code}</span> <span className="text-gray-400">{name}</span></span>
              <span className={code === 'CRS' ? 'text-band-red' : 'text-gray-200'}>{val}</span>
            </div>
            <div className="h-1.5 rounded bg-panel2 overflow-hidden">
              <div
                className={code === 'CRS' ? 'h-full bg-band-red' : 'h-full bg-gold'}
                style={{ width: `${val}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {lead.reasoning && (
        <p className="text-xs text-gray-500 mt-4 italic">{lead.reasoning}</p>
      )}
      <div className="mt-4 rounded-md border border-gold/30 bg-gold/5 p-3">
        <p className="label-mono mb-1">Recommendation</p>
        <p className="text-sm text-gray-200">{lead.action}</p>
      </div>
      {lead.contact && (
        <div className="mt-4 text-sm text-gray-400 space-y-1">
          {lead.contact.phone && <div>📞 {lead.contact.phone}</div>}
          {lead.contact.email && <div>✉️ {lead.contact.email}</div>}
        </div>
      )}
    </div>
  );
}

function ScorePill({ lead, big }) {
  return (
    <span className={`font-mono font-bold ${big ? 'text-3xl' : 'text-xl'} text-${'gold'}`}>
      {lead.lqs}
      <span className="text-xs text-gray-500"> LQS</span>
    </span>
  );
}

function Badge({ color, children }) {
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs ${BAND_STYLES[color]}`}>
      {children}
    </span>
  );
}

function EmptyState({ slug }) {
  return (
    <div className="rounded-lg border border-dashed border-panel2 p-10 text-center">
      <p className="text-gray-400 mb-2">No leads yet.</p>
      <p className="text-sm text-gray-500">
        Share your intake form: <span className="font-mono text-gold">/f/{slug}</span> — submissions
        appear here, scored, within seconds.
      </p>
    </div>
  );
}
