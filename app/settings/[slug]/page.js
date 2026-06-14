'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { PRACTICE_AREAS } from '../../../lib/intakeFields';

export default function Settings({ params }) {
  const { slug } = use(params);
  const router = useRouter();
  const [firm, setFirm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pushStatus, setPushStatus] = useState('idle'); // idle | requesting | granted | denied

  useEffect(() => {
    fetch(`/api/auth/me`).then(async (r) => {
      if (r.status === 401) { router.push('/login'); return; }
      const me = await r.json();
      if (me.user.firmSlug !== slug) { router.push('/login'); return; }
      // Fetch firm data via leads API session check
      setFirm({ slug, notifyEmail: '', alertWebhook: '', practiceAreas: [], jurisdiction: '', crm: {} });
    });
  }, [slug]);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    setError('');
    const form = new FormData(e.target);
    const updates = {
      name: form.get('name'),
      jurisdiction: form.get('jurisdiction'),
      notifyEmail: form.get('notifyEmail'),
      alertWebhook: form.get('alertWebhook'),
      practiceAreas: form.get('practiceAreas').split(',').map((s) => s.trim()).filter(Boolean),
    };
    const res = await fetch(`/api/firms/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (data.ok) { setFirm((f) => ({ ...f, ...data.firm })); setSaved(true); }
    else setError(data.error || 'Save failed');
    setBusy(false);
  }

  async function requestPush() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPushStatus('denied');
      return;
    }
    setPushStatus('requesting');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') { setPushStatus('denied'); return; }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) { setPushStatus('granted'); return; } // no key = just show granted state

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      setPushStatus('granted');
    } catch {
      setPushStatus('denied');
    }
  }

  if (!firm) return <div className="mx-auto max-w-xl px-6 py-16 text-gray-500">Loading…</div>;

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <p className="label-mono mb-1">Vector Mode Legal · Settings</p>
          <h1 className="font-serif text-3xl">Firm Settings</h1>
        </div>
        <a href={`/dashboard/${slug}`} className="text-sm text-gray-500 hover:text-gold">← Dashboard</a>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <Section title="Firm info">
          <Field name="name" label="Firm name" defaultValue={firm.name} />
          <Field name="jurisdiction" label="Jurisdiction" defaultValue={firm.jurisdiction} placeholder="e.g. California" />
          <div>
            <label className="block text-sm text-gray-300 mb-1">Practice areas (comma-separated)</label>
            <input name="practiceAreas" defaultValue={(firm.practiceAreas || []).join(', ')}
              placeholder={PRACTICE_AREAS.slice(0, 3).join(', ') + '…'}
              className="w-full rounded-md bg-panel border border-panel2 px-3 py-2 text-gray-100 focus:border-gold outline-none" />
          </div>
        </Section>

        <Section title="Notifications">
          <Field name="notifyEmail" label="Alert email (high-signal leads)" type="email" defaultValue={firm.notifyEmail} placeholder="attorney@yourfirm.com" />
          <Field name="alertWebhook" label="Webhook URL (optional — Slack, SMS gateway, etc.)" defaultValue={firm.alertWebhook} placeholder="https://hooks.slack.com/…" />

          <div className="rounded-lg border border-panel2 bg-panel p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-300 font-medium">Browser push notifications</div>
                <div className="text-xs text-gray-500 mt-0.5">Instant alert on your phone/desktop when a high-signal lead arrives</div>
              </div>
              {pushStatus === 'idle' && (
                <button type="button" onClick={requestPush}
                  className="rounded border border-gold/50 px-3 py-1.5 text-xs text-gold hover:bg-gold/10">
                  Enable
                </button>
              )}
              {pushStatus === 'requesting' && <span className="text-xs text-gray-500">Requesting…</span>}
              {pushStatus === 'granted' && <span className="text-xs text-band-green">✓ Enabled</span>}
              {pushStatus === 'denied' && <span className="text-xs text-band-red">Blocked by browser</span>}
            </div>
          </div>
        </Section>

        {saved && <p className="text-band-green text-sm">Settings saved.</p>}
        {error && <p className="text-band-red text-sm">{error}</p>}

        <button type="submit" disabled={busy}
          className="w-full rounded-md bg-gold py-3 font-semibold text-ink hover:bg-goldlight disabled:opacity-60">
          {busy ? 'Saving…' : 'Save settings'}
        </button>
      </form>

      <div className="mt-8 rounded-lg border border-panel2 bg-panel p-4">
        <p className="label-mono mb-2">Your intake form URL</p>
        <p className="font-mono text-sm text-gold break-all">/f/{slug}</p>
        <p className="text-xs text-gray-500 mt-1">Share this link with prospects, or embed it on your site.</p>
      </div>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="label-mono mb-3">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ name, label, type = 'text', defaultValue, placeholder }) {
  return (
    <div>
      <label className="block text-sm text-gray-300 mb-1">{label}</label>
      <input name={name} type={type} defaultValue={defaultValue || ''} placeholder={placeholder || ''}
        className="w-full rounded-md bg-panel border border-panel2 px-3 py-2 text-gray-100 focus:border-gold outline-none" />
    </div>
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
