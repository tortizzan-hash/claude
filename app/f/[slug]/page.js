'use client';

import { useState, use } from 'react';
import { PRACTICE_AREAS, fieldsFor } from '../../../lib/intakeFields';
import { INTAKE_FORM_DISCLAIMER, THANK_YOU_DISCLAIMER } from '../../../lib/disclaimers';

export default function IntakeForm({ params }) {
  const { slug } = use(params);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [practiceArea, setPracticeArea] = useState('');

  const extraFields = fieldsFor(practiceArea);

  async function onSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    const form = new FormData(e.target);
    const payload = { firmSlug: slug };
    for (const [key, value] of form.entries()) {
      if (value) payload[key] = value;
    }
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Submission failed');
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
        <h1 className="font-serif text-3xl mb-4">We've received your inquiry.</h1>
        <p className="text-gray-400">A member of the firm will follow up shortly. The more detail you provided, the faster we can help.</p>
        <p className="mt-8 text-xs text-gray-600 border-t border-panel2 pt-4 leading-relaxed">{THANK_YOU_DISCLAIMER}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <p className="label-mono mb-2">Vector Mode Legal · Intake</p>
      <h1 className="font-serif text-3xl mb-2">Tell us what happened.</h1>
      <p className="text-gray-400 mb-8 text-sm">Share the details of your situation. Everything you write helps us match you to the right attorney faster.</p>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Base contact fields */}
        <div className="grid grid-cols-2 gap-4">
          <Field name="name" label="Full name" />
          <Field name="phone" label="Phone number" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field name="email" label="Email" type="email" />
          <Field name="location" label="City / County" />
        </div>

        {/* Practice area selector — unlocks dynamic fields */}
        <div>
          <label className="block text-sm text-gray-300 mb-1">Type of matter</label>
          <select
            name="practiceArea"
            value={practiceArea}
            onChange={(e) => setPracticeArea(e.target.value)}
            className="w-full rounded-md bg-panel border border-panel2 px-3 py-2 text-gray-100 focus:border-gold outline-none"
          >
            <option value="">Select…</option>
            {PRACTICE_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Dynamic practice-area fields */}
        {extraFields.length > 0 && (
          <div className="rounded-lg border border-panel2 bg-panel/50 p-4 space-y-3">
            <p className="text-xs text-gray-500 uppercase tracking-widest">About your {practiceArea} case</p>
            {extraFields.map((f) => (
              f.type === 'select' ? (
                <div key={f.name}>
                  <label className="block text-sm text-gray-300 mb-1">{f.label}</label>
                  <select name={f.name} required={f.required}
                    className="w-full rounded-md bg-panel border border-panel2 px-3 py-2 text-gray-100 focus:border-gold outline-none">
                    <option value="">Select…</option>
                    {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ) : (
                <Field key={f.name} name={f.name} label={f.label} type={f.type} required={f.required} />
              )
            ))}
          </div>
        )}

        {/* Message */}
        <div>
          <label className="block text-sm text-gray-300 mb-1">What happened? <span className="text-gray-500">(the more detail, the better)</span></label>
          <textarea name="message" required rows={6}
            className="w-full rounded-md bg-panel border border-panel2 px-3 py-2 text-gray-100 focus:border-gold outline-none"
            placeholder="Describe your situation, when it happened, and what outcome you're looking for." />
        </div>

        {status === 'error' && <p className="text-band-red text-sm">{error}</p>}

        <p className="text-xs text-gray-600 leading-relaxed">{INTAKE_FORM_DISCLAIMER}</p>

        <button type="submit" disabled={status === 'submitting'}
          className="w-full rounded-md bg-gold py-3 font-semibold text-ink hover:bg-goldlight disabled:opacity-60">
          {status === 'submitting' ? 'Submitting…' : 'Submit inquiry'}
        </button>
      </form>
    </main>
  );
}

function Field({ name, label, type = 'text', required }) {
  return (
    <div>
      <label className="block text-sm text-gray-300 mb-1">{label}</label>
      <input name={name} type={type} required={required}
        className="w-full rounded-md bg-panel border border-panel2 px-3 py-2 text-gray-100 focus:border-gold outline-none" />
    </div>
  );
}
