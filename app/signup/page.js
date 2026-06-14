'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Signup() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(e.target);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firmName: form.get('firmName'),
        name: form.get('name'),
        email: form.get('email'),
        password: form.get('password'),
        jurisdiction: form.get('jurisdiction'),
        practiceAreas: form.get('practiceAreas'),
      }),
    });
    const data = await res.json();
    if (data.ok) {
      router.push(`/dashboard/${data.firmSlug}`);
    } else {
      setError(data.error || 'Sign up failed');
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <p className="label-mono mb-2">Vector Mode Legal</p>
      <h1 className="font-serif text-3xl mb-2">Create your firm account</h1>
      <p className="text-gray-400 mb-8 text-sm">
        Sets up your firm, your login, and your intake form in one step.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field name="firmName" label="Firm name" required />
        <div className="grid grid-cols-2 gap-4">
          <Field name="name" label="Your name" />
          <Field name="jurisdiction" label="Jurisdiction (e.g. California)" />
        </div>
        <Field name="practiceAreas" label="Practice areas (comma-separated)" />
        <Field name="email" label="Email" type="email" required />
        <Field name="password" label="Password (min 8 chars)" type="password" required />
        {error && <p className="text-band-red text-sm">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-gold py-3 font-semibold text-ink hover:bg-goldlight disabled:opacity-60"
        >
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-sm text-gray-500">
        Already have an account? <a href="/login" className="text-gold hover:underline">Sign in</a>
      </p>
    </main>
  );
}

function Field({ name, label, type = 'text', required }) {
  return (
    <div>
      <label className="block text-sm text-gray-300 mb-1">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-md bg-panel border border-panel2 px-3 py-2 text-gray-100 focus:border-gold outline-none"
      />
    </div>
  );
}
