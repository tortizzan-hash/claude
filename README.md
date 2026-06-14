# Vector Mode Legal — Intake Portal

The standalone app behind the **Client Login** on vectormodelegal.com. Attorneys log
in to see every inquiry scored, ranked, and routed in real time using the canonical
**LQS (Legal Qualification Score)** engine.

## What it does

1. **Public intake form** (`/f/[firm-slug]`) — a branded inquiry form you give each firm.
2. **Scoring** — each inquiry is read by Claude, which assigns the five LQS sub-scores
   (ISS, CFS, BIS, FRS, CRS). The final LQS is computed **deterministically** by the
   canon formula in `lib/lqs.js` — never left to the model.
3. **Attorney dashboard** (`/dashboard/[firm-slug]`) — leads ranked by LQS, color-banded,
   with the sub-score breakdown, override flags, and a recommended action.

## LQS engine (canon)

```
LQS_norm = (ISSn × CFSn × BISn × FRSn) / (1 + CRSn)
LQS      = LQS_norm × 100
```

Multiplicative by design — a weak link tanks the score. Resistance (CRS) divides it down.
Verified against the canon example (85/90/80/75/25 → 36.7) in `lib/lqs.test.js`.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # verify the LQS engine
```

Runs with **zero secrets**: no `ANTHROPIC_API_KEY` → heuristic scorer; no Supabase →
in-memory store. Add keys in `.env` (see `.env.example`) to enable AI scoring + persistence.

## Connecting Manus's marketing site

The marketing site connects through standard seams — no shared sandbox needed:

- **Login button** → point to `https://portal.vectormodelegal.com/dashboard/[firm-slug]`
- **Intake form** → `POST` to `/api/intake` with JSON:
  ```json
  { "firmSlug": "demo", "name": "...", "email": "...", "phone": "...",
    "practiceArea": "Auto Accident", "location": "Los Angeles", "message": "..." }
  ```
  CORS is open on this endpoint so the site can post cross-origin.

## Proof engine, alerts & CRM sync (Milestone 2)

- **Outcome tracking** — every lead carries a disposition (`new → contacted → booked →
  signed / dead`), set from the dashboard. `GET /api/stats/[slug]` computes conversion
  rates overall and **by LQS band**, plus the high-vs-low "lift" — the ROI proof buyers
  ask for. Builds itself passively as a firm works leads. See `lib/proof.js`.
- **Instant alerts** — a high-signal (or override-flagged) lead fires a webhook the moment
  it lands, so the firm can hit the ~5-minute response window. Configure per firm via
  `firm.alertWebhook` or globally via `ALERT_WEBHOOK_URL`. See `lib/alerts.js`.
- **CRM sync** — scored leads forward to Clio / Lawmatics / a generic webhook via
  `firm.crm = { provider, webhook, apiKey }`. See `lib/crm.js`. Alerts and CRM sync are
  fire-and-forget; they never block or fail the intake response.

## Status

Milestone 2 complete. **Next:** real auth for Client Login, multi-firm onboarding, and
provider-specific CRM adapters (Clio/Lawmatics OAuth).
