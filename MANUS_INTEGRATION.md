# Manus Integration Spec — vectormodelegal.com ↔ VML Portal

This document tells Manus exactly what to change on the marketing site to connect it
to the VML Intake Portal. No shared sandbox needed — everything connects through URLs
and a single API endpoint.

---

## 1. Client Login button

**Current:** "Client Login" button in the nav goes nowhere (or a placeholder URL).

**Change:** Point it to:
```
https://portal.vectormodelegal.com/login
```

That's a real, working login page. Attorneys land there, enter their email + password,
and are redirected to their firm dashboard.

---

## 2. Intake form → portal API

Any form on vectormodelegal.com that collects lead/inquiry information should POST to:

```
POST https://portal.vectormodelegal.com/api/intake
Content-Type: application/json
```

**Payload shape:**
```json
{
  "firmSlug":    "demo",
  "name":        "Maria Lopez",
  "email":       "maria@example.com",
  "phone":       "555-0199",
  "practiceArea": "Auto Accident",
  "location":    "Los Angeles, CA",
  "message":     "I was rear-ended last week..."
}
```

- `firmSlug` is the firm's unique identifier (assigned when they sign up).
- All fields except `firmSlug` and `message` are optional — but the more collected,
  the higher the scoring signal.
- CORS is open on this endpoint — cross-origin POST from any domain is allowed.

**On success (200):**
```json
{ "ok": true, "lead": { "id": "...", "lqs": 61.2, "band": "qualified", ... } }
```

The response can be ignored or used to show a "Thank you" message.

---

## 3. "Apply for the Sprint" / firm application form (optional)

If there's a form where attorneys apply to work with VML, its data can go to the same
`/api/intake` endpoint with the firmSlug `"vml-internal"`, or be kept separate.
Alternatively, point the CTA to:
```
https://portal.vectormodelegal.com/signup
```
That's a working firm onboarding page — they fill in firm name, email, password,
practice areas, jurisdiction, and land immediately in their dashboard.

---

## 4. "LQS System" nav link

The nav already has an "LQS System" link. Point it to either:
- A section on the marketing page explaining LQS (already exists on the site), OR
- `https://portal.vectormodelegal.com/login` if the intent is for clients to access
  their scoring dashboard directly.

---

## 5. Subdomain setup (optional but recommended)

To make it feel like one product:

1. Add a CNAME record: `portal.vectormodelegal.com → cname.vercel-dns.com`
2. Add the custom domain in Vercel project settings.
3. All the URLs above (`portal.vectormodelegal.com/login`, `/api/intake`, etc.) work
   immediately once DNS propagates (~10 min).

Without this, the portal runs at whatever Vercel URL is assigned (e.g.
`vml-portal.vercel.app`). The integration works identically either way.

---

## 6. What NOT to change

- Do not replicate the dashboard or scoring logic on the marketing site. All of that
  lives in the portal.
- Do not store lead data on the marketing site. `POST /api/intake` handles storage,
  scoring, alerts, and CRM sync in one call.
- The portal handles auth entirely. No session logic needed on the marketing site.

---

## Summary of changes

| Location | Change |
|---|---|
| Nav "Client Login" button | href → `https://portal.vectormodelegal.com/login` |
| Any lead capture form | POST to `https://portal.vectormodelegal.com/api/intake` |
| "Apply" CTA (optional) | href → `https://portal.vectormodelegal.com/signup` |
| DNS (optional) | CNAME `portal` → `cname.vercel-dns.com` |

That's it. Four changes, all pointing at the portal.
