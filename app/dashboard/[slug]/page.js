'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

const BAND_STYLES = {
  green: 'bg-band-green/15 text-band-green border-band-green/40',
  yellow: 'bg-band-yellow/15 text-gold border-band-yellow/40',
  orange: 'bg-band-orange/15 text-band-orange border-band-orange/40',
  red: 'bg-band-red/15 text-band-red border-band-red/40',
};

export default function Dashboard({ params }) {
  const { slug } = use(params);
  const router = useRouter();
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  async function load() {
    const leadsRes = await fetch(`/api/leads/${slug}`);
    if (leadsRes.status === 401 || leadsRes.status === 403) {
      router.push('/login');
      return;
    }
    const leadsData = await leadsRes.json();
    const statsData = await fetch(`/api/stats/${slug}`).then((r) => r.json());
    if (leadsData.ok) setLeads(leadsData.leads);
    if (statsData.ok) setStats(statsData);
    setLoading(false);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  async function setDisposition(lead, disposition) {
    const res = await fetch(`/api/leads/${slug}/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disposition }),
    });
    const data = await res.json();
    if (data.ok) {
      setSelected(data.lead);
      load();
    }
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
          <button onClick={logout} className="mt-1 text-xs text-gray-500 hover:text-gold">
            Sign out
          </button>
        </div>
      </header>

      {stats && stats.summary.total > 0 && <ProofBar stats={stats} />}

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
            {selected ? <LeadDetail lead={selected} onDisposition={setDisposition} /> : (
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

const DISPOSITION_OPTIONS = [
  ['new', 'New'],
  ['contacted', 'Contacted'],
  ['booked', 'Booked'],
  ['signed', 'Signed'],
  ['dead', 'Dead'],
];

function ProofBar({ stats }) {
  const { summary, perBand } = stats;
  const liftLabel =
    summary.lift === null ? '—' : summary.lift === Infinity ? '∞' : `${summary.lift}×`;
  return (
    <div className="mb-6 rounded-lg border border-gold/30 bg-gold/5 p-4">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
        <Stat label="Leads" value={summary.total} />
        <Stat label="Converted" value={`${summary.converted} (${summary.conversionRate}%)`} />
        <Stat label="Signed" value={summary.signed} />
        <Stat label="High-band conv." value={`${perBand.high.conversionRate}%`} />
        <Stat label="Low-band conv." value={`${perBand.low.conversionRate}%`} />
        <Stat label="LQS lift (high vs low)" value={liftLabel} highlight />
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Proof engine — conversion by LQS band, updated as leads are worked. This is the
        ROI data for audits and renewals.
      </p>
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div>
      <div className={`font-mono text-lg ${highlight ? 'text-gold' : 'text-gray-100'}`}>{value}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function LeadDetail({ lead, onDisposition }) {
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

      <div className="mt-4">
        <p className="label-mono mb-2">Outcome</p>
        <div className="flex flex-wrap gap-1.5">
          {DISPOSITION_OPTIONS.map(([value, label]) => (
            <button
              key={value}
              onClick={() => onDisposition?.(lead, value)}
              className={`rounded border px-2.5 py-1 text-xs transition ${
                lead.disposition === value
                  ? 'border-gold bg-gold text-ink font-semibold'
                  : 'border-panel2 text-gray-400 hover:border-gold/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
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
