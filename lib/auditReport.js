/**
 * Audit report generator — synthesizes a firm's lead data into the $750 deliverable.
 *
 * Produces a structured report object that the /audit/[slug] page renders as a
 * printable, branded document. The report covers:
 *   - Firm snapshot
 *   - LQS distribution (how leads land across bands)
 *   - Conversion proof (band vs. outcome correlation)
 *   - Missed opportunities (high-signal leads that went cold)
 *   - Intake health diagnosis (where the funnel is leaking)
 *   - Recommendations (specific, ranked by impact)
 */

const { BANDS } = require('./proof');

/**
 * Generate a full audit report from a firm record + its leads.
 * @param {object} firm
 * @param {object[]} leads
 * @returns {object} report
 */
function generateReport(firm, leads) {
  const now = new Date();
  const bandCounts = bandDistribution(leads);
  const conversion = conversionByBand(leads);
  const missed = missedOpportunities(leads);
  const health = intakeHealth(leads);
  const recommendations = buildRecommendations({ leads, bandCounts, conversion, missed, health });

  return {
    generatedAt: now.toISOString(),
    firm: {
      name: firm.name,
      slug: firm.slug,
      practiceAreas: firm.practiceAreas || [],
      jurisdiction: firm.jurisdiction || '',
    },
    summary: {
      totalLeads: leads.length,
      scoredLeads: leads.filter((l) => l.lqs != null).length,
      avgLqs: avg(leads.map((l) => l.lqs).filter(Boolean)),
      highSignal: bandCounts.high.count,
      converted: leads.filter((l) => l.disposition === 'booked' || l.disposition === 'signed').length,
      signed: leads.filter((l) => l.disposition === 'signed').length,
      overallConversionRate: pct(
        leads.filter((l) => l.disposition === 'booked' || l.disposition === 'signed').length,
        leads.length
      ),
      dateRange: dateRange(leads),
    },
    bandDistribution: bandCounts,
    conversionByBand: conversion,
    missedOpportunities: missed,
    intakeHealth: health,
    recommendations,
  };
}

// ---- Sections ----

function bandDistribution(leads) {
  const out = {};
  for (const band of BANDS) {
    const inBand = leads.filter((l) => l.band === band);
    out[band] = {
      count: inBand.length,
      pct: pct(inBand.length, leads.length),
      avgLqs: avg(inBand.map((l) => l.lqs)),
    };
  }
  return out;
}

function conversionByBand(leads) {
  const out = {};
  for (const band of BANDS) {
    const inBand = leads.filter((l) => l.band === band);
    const converted = inBand.filter(
      (l) => l.disposition === 'booked' || l.disposition === 'signed'
    );
    out[band] = {
      total: inBand.length,
      converted: converted.length,
      rate: pct(converted.length, inBand.length),
    };
  }
  // Lift: high-band rate vs low-band rate
  const highRate = out.high.rate;
  const lowRate = out.low.rate;
  out._lift = lowRate > 0 ? Math.round((highRate / lowRate) * 10) / 10 : null;
  return out;
}

function missedOpportunities(leads) {
  // High-signal or override-flagged leads that went dead or are still "new" after 48h.
  const now = Date.now();
  const stale = leads.filter((l) => {
    if (l.band !== 'high' && !l.forceReview) return false;
    if (l.disposition === 'signed' || l.disposition === 'booked') return false;
    if (l.disposition === 'dead') return true;
    // Still "new" or "contacted" after 48h = at risk
    const age = now - new Date(l.createdAt).getTime();
    return age > 48 * 60 * 60 * 1000 && (l.disposition === 'new' || l.disposition === 'contacted');
  });
  return stale.map((l) => ({
    id: l.id,
    name: l.contact?.name || 'Anonymous',
    lqs: l.lqs,
    label: l.label,
    disposition: l.disposition,
    overrides: l.overrides || [],
    message: l.message?.slice(0, 120),
    createdAt: l.createdAt,
  }));
}

function intakeHealth(leads) {
  const total = leads.length;
  if (!total) return { score: 0, issues: ['No leads captured yet.'] };

  const issues = [];
  const strengths = [];

  const highPct = pct(leads.filter((l) => l.band === 'high').length, total);
  const stalePct = pct(
    leads.filter((l) => l.disposition === 'new' && ageHours(l) > 24).length,
    total
  );
  const deadHighPct = pct(
    leads.filter((l) => l.band === 'high' && l.disposition === 'dead').length,
    leads.filter((l) => l.band === 'high').length || 1
  );
  const convRate = pct(
    leads.filter((l) => l.disposition === 'booked' || l.disposition === 'signed').length,
    total
  );
  const noContactPct = pct(
    leads.filter((l) => !l.contact?.phone && !l.contact?.email).length,
    total
  );

  if (stalePct > 30) issues.push(`${stalePct}% of leads untouched after 24 hours — speed-to-lead gap.`);
  if (deadHighPct > 20) issues.push(`${deadHighPct}% of high-signal leads went cold — qualification is working but follow-up is not.`);
  if (noContactPct > 40) issues.push(`${noContactPct}% of leads have no phone or email — intake form is not capturing contact info.`);
  if (highPct < 10) issues.push(`Only ${highPct}% of leads are high-signal — either traffic quality is low or the intake form is not filtering well.`);

  if (convRate > 30) strengths.push(`${convRate}% overall conversion rate — above the industry average of 14%.`);
  if (highPct > 25) strengths.push(`${highPct}% of leads are high-signal — strong lead quality.`);
  if (stalePct < 15) strengths.push('Leads are being worked quickly — good response speed.');

  // 0-100 health score: start at 100, deduct for issues
  const score = Math.max(0, 100 - issues.length * 22 + strengths.length * 8);

  return { score: Math.min(100, score), issues, strengths };
}

function buildRecommendations({ leads, bandCounts, conversion, missed, health }) {
  const recs = [];

  if (missed.length > 0) {
    recs.push({
      priority: 'critical',
      title: `${missed.length} high-signal lead${missed.length > 1 ? 's' : ''} need immediate attention`,
      detail: 'These are your best prospects — they scored high on signal, fit, and intent. Contact them today.',
    });
  }

  if (health.issues.some((i) => i.includes('speed-to-lead'))) {
    recs.push({
      priority: 'high',
      title: 'Enable instant alerts for high-signal leads',
      detail: 'Responding within 5 minutes makes a firm 21× more likely to convert. Set up SMS or email alerts in firm settings.',
    });
  }

  if (conversion.high.rate < 40 && conversion.high.total > 0) {
    recs.push({
      priority: 'high',
      title: 'Improve follow-up on high-signal leads',
      detail: `You're converting ${conversion.high.rate}% of high-signal leads. A structured follow-up sequence (call → SMS → email) typically reaches 40%+.`,
    });
  }

  if (health.issues.some((i) => i.includes('contact info'))) {
    recs.push({
      priority: 'medium',
      title: 'Require phone or email on intake form',
      detail: 'Leads without contact info cannot be reached. Make at least one contact field required.',
    });
  }

  if (bandCounts.low.count > bandCounts.high.count * 2) {
    recs.push({
      priority: 'medium',
      title: 'Lead quality review — too many low-signal inquiries',
      detail: 'More than half of leads are low-signal. Consider tightening ad targeting or adding a pre-qualification question to the intake form.',
    });
  }

  recs.push({
    priority: 'low',
    title: 'Track outcomes consistently',
    detail: 'Mark every lead as contacted, booked, signed, or dead in the dashboard. The conversion-by-band data becomes your ROI proof for renewals.',
  });

  return recs;
}

// ---- Helpers ----

function pct(n, d) {
  if (!d) return 0;
  return Math.round((n / d) * 100 * 10) / 10;
}

function avg(nums) {
  const valid = nums.filter((n) => typeof n === 'number' && !isNaN(n));
  if (!valid.length) return 0;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
}

function ageHours(lead) {
  return (Date.now() - new Date(lead.createdAt).getTime()) / 3600000;
}

function dateRange(leads) {
  if (!leads.length) return null;
  const dates = leads.map((l) => new Date(l.createdAt)).sort((a, b) => a - b);
  return { from: dates[0].toISOString(), to: dates[dates.length - 1].toISOString() };
}

module.exports = { generateReport };
