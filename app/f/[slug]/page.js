'use client';

import { useState, use } from 'react';

export default function IntakeForm({ params }) {
  const { slug } = use(params);
  const [status, setStatus] = useState('idle'); // idle | submitting | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    const form = new FormData(e.target);
    const payload = {
      firmSlug: slug,
      name: form.get('name'),
      email: form.get('email'),
      phone: form.get('phone'),
      practiceArea: form.get('practiceArea'),
      location: form.get('location'),
      message: form.get('message'),
    };
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Submission failed');
      setResult(data.lead);
      setStatus('done');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <main className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="label-mono mb-4">Vector Mode Legal</p>
        <h1 className="font-serif text-3xl mb-4">Thank you — we’ve received your inquiry.</h1>
        <p className="text-gray-400">
          A member of the firm will follow up shortly. The more detail you provided, the
          faster we can help.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <p className="label-mono mb-2">Vector Mode Legal · Intake</p>
      <h1 className="font-serif text-3xl mb-2">Tell us what happened.</h1>
      <p className="text-gray-400 mb-8">
        Share the details of your situation and the firm will respond. Everything you write
        helps us route you to the right attorney faster.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field name="name" label="Full name" />
          <Field name="phone" label="Phone" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field name="email" label="Email" type="email" />
          <Field name="location" label="City / County" />
        </div>
        <Field name="practiceArea" label="Type of matter (e.g. Auto Accident)" />
        <div>
          <label className="block text-sm text-gray-300 mb-1">What happened?</label>
          <textarea
            name="message"
            required
            rows={6}
            className="w-full rounded-md bg-panel border border-panel2 px-3 py-2 text-gray-100 focus:border-gold outline-none"
            placeholder="Describe your situation, when it happened, and what you need help with."
          />
        </div>

        {status === 'error' && <p className="text-band-red text-sm">{error}</p>}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full rounded-md bg-gold py-3 font-semibold text-ink hover:bg-goldlight disabled:opacity-60"
        >
          {status === 'submitting' ? 'Submitting…' : 'Submit inquiry'}
        </button>
      </form>
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
        className="w-full rounded-md bg-panel border border-panel2 px-3 py-2 text-gray-100 focus:border-gold outline-none"
      />
    </div>
  );
}
