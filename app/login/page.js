'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(e.target);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
    });
    const data = await res.json();
    if (data.ok) {
      router.push(`/dashboard/${data.firmSlug}`);
    } else {
      setError(data.error || 'Login failed');
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <p className="label-mono mb-2">Vector Mode Legal</p>
      <h1 className="font-serif text-3xl mb-6">Client Login</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field name="email" label="Email" type="email" />
        <Field name="password" label="Password" type="password" />
        {error && <p className="text-band-red text-sm">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-gold py-3 font-semibold text-ink hover:bg-goldlight disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-sm text-gray-500">
        New firm? <a href="/signup" className="text-gold hover:underline">Create an account</a>
      </p>
      <p className="mt-2 text-xs text-gray-600">
        Demo: demo@vectormodelegal.com / demo1234
      </p>
    </main>
  );
}

function Field({ name, label, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm text-gray-300 mb-1">{label}</label>
      <input
        name={name}
        type={type}
        required
        className="w-full rounded-md bg-panel border border-panel2 px-3 py-2 text-gray-100 focus:border-gold outline-none"
      />
    </div>
  );
}
