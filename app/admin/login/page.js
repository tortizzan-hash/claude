'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(e.target);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
    });
    const data = await res.json();
    if (data.ok) {
      router.push('/admin');
    } else {
      setError(data.error || 'Login failed');
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <p className="label-mono mb-2">Vector Mode Legal</p>
      <h1 className="font-serif text-3xl mb-1">Admin</h1>
      <p className="text-gray-500 text-sm mb-8">VML internal access only.</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Email</label>
          <input name="email" type="email" required
            className="w-full rounded-md bg-panel border border-panel2 px-3 py-2 text-gray-100 focus:border-gold outline-none" />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Password</label>
          <input name="password" type="password" required
            className="w-full rounded-md bg-panel border border-panel2 px-3 py-2 text-gray-100 focus:border-gold outline-none" />
        </div>
        {error && <p className="text-band-red text-sm">{error}</p>}
        <button type="submit" disabled={busy}
          className="w-full rounded-md bg-gold py-3 font-semibold text-ink hover:bg-goldlight disabled:opacity-60">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
