/**
 * Seeded demo data — makes the demo firm look like it's been in use for a month.
 *
 * Produces 9 realistic leads across multiple practice areas, spanning all four
 * LQS bands, with dispositions and notes already populated so the dashboard,
 * ProofBar, and audit report all show useful history in a live demo.
 *
 * Scores are computed through the real LQS engine so the bands are authentic.
 */

const { scoreLead } = require('./lqs');

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

// Each entry: contact, matter, subscores, flags, disposition, notes, age.
const SEED = [
  {
    name: 'Maria Lopez', phone: '(213) 555-0142', email: 'maria.lopez@email.com',
    practiceArea: 'Auto Accident', location: 'Los Angeles, CA',
    message: 'I was rear-ended on the 405 last Tuesday and taken to the hospital with a back injury. The other driver admitted fault and has full insurance coverage. I have all the police and medical reports. I have not hired an attorney and want to move quickly.',
    sub: { iss: 98, cfs: 97, bis: 96, frs: 94, crs: 4 },
    flags: { highValueCaseType: true, severeHarm: true },
    disposition: 'signed', ageDays: 21,
    notes: ['Called within 10 min of submission — booked consult same day.', 'Signed retainer Thursday. Strong liability, clear damages.'],
  },
  {
    name: 'James Carter', phone: '(310) 555-0188', email: 'jcarter@email.com',
    practiceArea: 'Personal Injury', location: 'Santa Monica, CA',
    message: 'Slipped on an unmarked wet floor at a grocery store, fractured my wrist. Store manager filed an incident report. Looking for representation.',
    sub: { iss: 88, cfs: 90, bis: 85, frs: 85, crs: 12 },
    flags: { highValueCaseType: true },
    disposition: 'booked', ageDays: 14,
    notes: ['Consult scheduled for Monday 2pm. Requested incident report copy.'],
  },
  {
    name: 'Aisha Bell', phone: '(818) 555-0133', email: 'aisha.bell@email.com',
    practiceArea: 'Family Law', location: 'Burbank, CA',
    message: 'Filing for divorce, we have two children and need help with custody. My spouse already has a lawyer. There is a hearing in three weeks.',
    sub: { iss: 90, cfs: 88, bis: 88, frs: 80, crs: 22 },
    flags: { urgentDeadline: true, courtDateSoon: true },
    disposition: 'contacted', ageDays: 4,
    notes: ['Left voicemail + sent intake packet. Awaiting financials.'],
  },
  {
    name: 'Robert Nguyen', phone: '(714) 555-0177', email: '',
    practiceArea: 'Employment Law', location: 'Anaheim, CA',
    message: 'I was fired after reporting safety violations. I think it was retaliation. Still gathering documents.',
    sub: { iss: 72, cfs: 82, bis: 68, frs: 80, crs: 30 },
    flags: {},
    disposition: 'new', ageDays: 2,
    notes: [],
  },
  {
    name: 'Diana Flores', phone: '(323) 555-0155', email: 'dflores@email.com',
    practiceArea: 'Auto Accident', location: 'Long Beach, CA',
    message: 'Minor fender bender, no injuries really, just wondering what my options are. Other driver and I exchanged info.',
    sub: { iss: 58, cfs: 80, bis: 45, frs: 75, crs: 40 },
    flags: {},
    disposition: 'new', ageDays: 6,
    notes: [],
  },
  {
    name: 'Kevin Park', phone: '', email: 'kpark@email.com',
    practiceArea: 'Criminal Defense', location: 'Pasadena, CA',
    message: 'Got a DUI over the weekend, court date is next month. Need a lawyer.',
    sub: { iss: 70, cfs: 78, bis: 75, frs: 78, crs: 28 },
    flags: { courtDateSoon: true },
    disposition: 'contacted', ageDays: 3,
    notes: ['Spoke briefly, quoted flat fee. Considering options.'],
  },
  {
    name: 'Anonymous', phone: '', email: '',
    practiceArea: 'Family Law', location: '',
    message: 'how much do you charge for a divorce',
    sub: { iss: 25, cfs: 55, bis: 30, frs: 70, crs: 60 },
    flags: {},
    disposition: 'dead', ageDays: 9,
    notes: ['No contact info, one-line message. Could not follow up.'],
  },
  {
    name: 'Thomas Reed', phone: '(626) 555-0199', email: 'treed@email.com',
    practiceArea: 'Workers Compensation', location: 'Glendale, CA',
    message: 'Hurt my shoulder lifting at work three weeks ago, reported it to my employer, but my claim was denied. Need help appealing.',
    sub: { iss: 85, cfs: 88, bis: 80, frs: 82, crs: 18 },
    flags: { highValueCaseType: true },
    disposition: 'booked', ageDays: 7,
    notes: ['Denial letter received. Consult booked Friday.'],
  },
  {
    name: 'Sofia Martinez', phone: '(213) 555-0166', email: '',
    practiceArea: 'Immigration', location: 'Los Angeles, CA',
    message: 'I have a removal hearing coming up and need representation as soon as possible. Very urgent.',
    sub: { iss: 80, cfs: 60, bis: 85, frs: 65, crs: 35 },
    flags: { urgentDeadline: true, courtDateSoon: true },
    disposition: 'new', ageDays: 1,
    notes: [],
  },
];

/**
 * Build full lead records for the given firm slug, scored through the real engine.
 */
function demoLeads(firmSlug = 'demo') {
  return SEED.map((s, i) => {
    const scored = scoreLead(s.sub, s.flags);
    return {
      id: `demo_lead_${i + 1}`,
      firmSlug,
      contact: { name: s.name, email: s.email, phone: s.phone },
      practiceArea: s.practiceArea,
      location: s.location,
      message: s.message,
      scoringStatus: 'scored',
      ...scored,
      reasoning: scored.reasoning || 'Demo lead scored via the LQS engine.',
      disposition: s.disposition,
      dispositionAt: s.disposition === 'new' ? null : daysAgo(s.ageDays - 0.5),
      notes: s.notes.map((text, ni) => ({ text, createdAt: daysAgo(s.ageDays - ni * 0.3) })),
      createdAt: daysAgo(s.ageDays),
    };
  });
}

module.exports = { demoLeads };
