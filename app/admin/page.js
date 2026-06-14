'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPanel() {
  const router = useRouter();
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/firms')
      .then((r) => {
        if (r.status === 401) { router.push('/admin/login'); return null; }
        return r.json();
      })
      .then((d) => { if (d?.ok) { setFirms(d.firms); setLoading(false); } });
  }, []);

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex items-baseline justify-between border-b border-panel2 pb-4 mb-6">
        <div>
          <p className="label-mono">Vector Mode Legal · Admin</p>
          <h1 className="font-serif text-3xl mt-1">All Firms</h1>
        </div>
        <div className="text-right text-sm text-gray-400">
          <div>{firms.length} firms</div>
          <button onClick={logout} className="mt-1 text-xs text-gray-500 hover:text-gold">Sign out</button>
        </div>
      </header>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : firms.length === 0 ? (
        <p className="text-gray-500">No firms yet. Once a firm signs up, they appear here.</p>
      ) : (
        <div className="space-y-3">
          {firms.map((firm) => (
            <FirmRow key={firm.slug} firm={firm} />
          ))}
        </div>
      )}
    </main>
  );
}

function FirmRow({ firm }) {
  return (
    <div className="rounded-lg border border-panel2 bg-panel p-4 flex items-center justify-between">
      <div>
        <div className="font-serif text-lg">{firm.name}</div>
        <div className="text-sm text-gray-400">
          {firm.jurisdiction && <span>{firm.jurisdiction} · </span>}
          <span className="font-mono text-xs text-gray-500">{firm.slug}</span>
        </div>
        {firm.practiceAreas?.length > 0 && (
          <div className="text-xs text-gray-500 mt-0.5">{firm.practiceAreas.join(', ')}</div>
        )}
      </div>
      <div className="flex gap-2">
        <a href={`/dashboard/${firm.slug}`}
          className="rounded border border-panel2 px-3 py-1.5 text-xs text-gray-300 hover:border-gold/50">
          Dashboard
        </a>
        <a href={`/admin/audit/${firm.slug}`}
          className="rounded border border-gold/50 bg-gold/10 px-3 py-1.5 text-xs text-gold hover:bg-gold/20">
          Audit report
        </a>
      </div>
    </div>
  );
}
