'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

const PRIORITY_STYLES = {
  critical: 'border-band-red/50 bg-band-red/10 text-band-red',
  high: 'border-band-orange/50 bg-band-orange/10 text-band-orange',
  medium: 'border-gold/50 bg-gold/10 text-gold',
  low: 'border-panel2 bg-panel text-gray-400',
};

const BAND_COLORS = {
  high: 'text-band-green',
  qualified: 'text-gold',
  review: 'text-band-orange',
  low: 'text-band-red',
};

const BAND_LABELS = { high: 'High Signal', qualified: 'Qualified', review: 'Needs Review', low: 'Low Priority' };

export default function AuditReport({ params }) {
  const { slug } = use(params);
  const router = useRouter();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/admin/report/${slug}`)
      .then((r) => {
        if (r.status === 401) { router.push('/admin/login'); return null; }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        if (d.ok) setReport(d.report);
        else setError(d.error);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <div className="mx-auto max-w-4xl px-6 py-16 text-gray-500">Generating report…</div>;
  if (error) return <div className="mx-auto max-w-4xl px-6 py-16 text-band-red">{error}</div>;
  if (!report) return null;

  const { firm, summary, bandDistribution: bd, conversionByBand: cv, missedOpportunities: mo, intakeHealth: ih, recommendations: recs } = report;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 print:py-4 print:px-0">

      {/* Header */}
      <div className="border-b border-panel2 pb-6 mb-8 print:mb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="label-mono mb-1">Vector Mode Legal · Intake Audit</p>
            <h1 className="font-serif text-4xl">{firm.name}</h1>
            <p className="text-gray-400 mt-1">
              {firm.jurisdiction && <span>{firm.jurisdiction} · </span>}
              {firm.practiceAreas.join(', ')}
            </p>
          </div>
          <div className="text-right text-sm text-gray-500 print:hidden">
            <button onClick={() => window.print()}
              className="rounded border border-gold/50 bg-gold/10 px-4 py-2 text-gold hover:bg-gold/20 mb-2 block ml-auto">
              Print / Save PDF
            </button>
            <a href="/admin" className="text-gray-500 hover:text-gold text-xs">← All firms</a>
          </div>
        </div>
        {summary.dateRange && (
          <p className="text-xs text-gray-600 mt-2">
            Data: {fmt(summary.dateRange.from)} → {fmt(summary.dateRange.to)} ·
            Generated {fmt(report.generatedAt)}
          </p>
        )}
      </div>

      {/* Summary stats */}
      <section className="mb-8">
        <h2 className="label-mono mb-4">Snapshot</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total leads" value={summary.totalLeads} />
          <StatCard label="High-signal" value={summary.highSignal} color="text-band-green" />
          <StatCard label="Converted" value={`${summary.converted} (${summary.overallConversionRate}%)`} />
          <StatCard label="Signed" value={summary.signed} color="text-gold" />
        </div>
      </section>

      {/* Intake health */}
      <section className="mb-8">
        <h2 className="label-mono mb-4">Intake Health Score</h2>
        <div className="rounded-lg border border-panel2 bg-panel p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className={`font-mono text-5xl font-bold ${ih.score >= 70 ? 'text-band-green' : ih.score >= 40 ? 'text-gold' : 'text-band-red'}`}>
              {ih.score}
            </div>
            <div className="text-sm text-gray-400">out of 100</div>
          </div>
          {ih.strengths.length > 0 && (
            <div className="mb-3">
              {ih.strengths.map((s, i) => (
                <p key={i} className="text-sm text-band-green before:content-['✓_']">{s}</p>
              ))}
            </div>
          )}
          {ih.issues.length > 0 && (
            <div>
              {ih.issues.map((s, i) => (
                <p key={i} className="text-sm text-band-orange before:content-['⚠_']">{s}</p>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* LQS distribution */}
      <section className="mb-8">
        <h2 className="label-mono mb-4">LQS Distribution</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['high', 'qualified', 'review', 'low'].map((band) => (
            <div key={band} className="rounded-lg border border-panel2 bg-panel p-4">
              <div className={`font-mono text-3xl font-bold ${BAND_COLORS[band]}`}>{bd[band].count}</div>
              <div className="text-sm text-gray-300 mt-0.5">{BAND_LABELS[band]}</div>
              <div className="text-xs text-gray-500">{bd[band].pct}% of leads</div>
              {bd[band].avgLqs > 0 && <div className="text-xs text-gray-600 mt-0.5">avg LQS {bd[band].avgLqs}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Conversion by band */}
      <section className="mb-8">
        <h2 className="label-mono mb-4">Conversion by LQS Band</h2>
        <div className="rounded-lg border border-panel2 bg-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-panel2 text-gray-500 text-xs">
                <th className="text-left px-4 py-2">Band</th>
                <th className="text-right px-4 py-2">Leads</th>
                <th className="text-right px-4 py-2">Converted</th>
                <th className="text-right px-4 py-2">Rate</th>
              </tr>
            </thead>
            <tbody>
              {['high', 'qualified', 'review', 'low'].map((band) => (
                <tr key={band} className="border-b border-panel2/50 last:border-0">
                  <td className={`px-4 py-3 font-medium ${BAND_COLORS[band]}`}>{BAND_LABELS[band]}</td>
                  <td className="px-4 py-3 text-right text-gray-300">{cv[band].total}</td>
                  <td className="px-4 py-3 text-right text-gray-300">{cv[band].converted}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-100">{cv[band].rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {cv._lift && (
            <div className="px-4 py-3 border-t border-panel2 text-xs text-gray-500">
              High-signal leads convert at <span className="text-gold font-mono">{cv._lift}×</span> the rate of low-signal leads.
            </div>
          )}
        </div>
      </section>

      {/* Missed opportunities */}
      {mo.length > 0 && (
        <section className="mb-8">
          <h2 className="label-mono mb-4">Missed Opportunities ({mo.length})</h2>
          <div className="space-y-2">
            {mo.map((m, i) => (
              <div key={i} className="rounded-lg border border-band-red/30 bg-band-red/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-serif">{m.name}</span>
                  <span className="font-mono text-gold">{m.lqs} LQS</span>
                </div>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{m.message}</p>
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="text-band-red">{m.disposition}</span>
                  {m.overrides.map((o) => <span key={o} className="text-band-orange">{o}</span>)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      <section className="mb-8">
        <h2 className="label-mono mb-4">Recommendations</h2>
        <div className="space-y-3">
          {recs.map((rec, i) => (
            <div key={i} className={`rounded-lg border p-4 ${PRIORITY_STYLES[rec.priority]}`}>
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs uppercase mt-0.5 shrink-0">{rec.priority}</span>
                <div>
                  <div className="font-semibold text-gray-100">{rec.title}</div>
                  <div className="text-sm text-gray-400 mt-0.5">{rec.detail}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-panel2 pt-6 text-xs text-gray-600">
        <p>Vector Mode Legal · vectormodelegal.com · Prepared for {firm.name}</p>
        <p className="mt-1">This report was generated on {fmt(report.generatedAt)} and reflects intake data up to that date.</p>
      </footer>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-lg border border-panel2 bg-panel p-4">
      <div className={`font-mono text-2xl font-bold ${color || 'text-gray-100'}`}>{value}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
