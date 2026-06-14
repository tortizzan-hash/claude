/**
 * Practice-area-specific intake field definitions.
 *
 * Each entry defines extra fields shown to the prospect beyond the base set
 * (name, phone, email, location, message). The AI scorer benefits from this
 * structured data: a known accident date improves ISS; "no-fault state" context
 * improves CFS scoring accuracy.
 */

const PRACTICE_AREAS = [
  'Auto Accident',
  'Personal Injury',
  'Family Law',
  'Criminal Defense',
  'Employment Law',
  'Immigration',
  'Workers Compensation',
  'Estate Planning',
  'Business Law',
  'Real Estate',
];

/** Extra fields per practice area. Each field: { name, label, type, required?, options? } */
const AREA_FIELDS = {
  'Auto Accident': [
    { name: 'accidentDate', label: 'Date of accident', type: 'date', required: true },
    { name: 'atFault', label: 'Who was at fault?', type: 'select', options: ['Other driver', 'Unknown', 'Shared', 'Me'] },
    { name: 'injured', label: 'Were you injured?', type: 'select', options: ['Yes — treated at hospital', 'Yes — saw a doctor', 'Yes — no treatment yet', 'No injury'] },
    { name: 'hasInsurance', label: 'Did the other driver have insurance?', type: 'select', options: ['Yes', 'No', "Don't know"] },
  ],
  'Personal Injury': [
    { name: 'incidentDate', label: 'Date of incident', type: 'date', required: true },
    { name: 'incidentType', label: 'Type of incident', type: 'select', options: ['Slip and fall', 'Dog bite', 'Medical malpractice', 'Defective product', 'Assault', 'Other'] },
    { name: 'injured', label: 'Injury severity', type: 'select', options: ['Hospitalized', 'Treated by doctor', 'Minor / no treatment', 'Unknown extent'] },
  ],
  'Family Law': [
    { name: 'matterType', label: 'Type of matter', type: 'select', options: ['Divorce', 'Child custody', 'Child support', 'Adoption', 'Domestic violence', 'Prenuptial agreement', 'Other'], required: true },
    { name: 'childrenInvolved', label: 'Are children involved?', type: 'select', options: ['Yes', 'No'] },
    { name: 'urgency', label: 'How urgent is this?', type: 'select', options: ['Court date within 30 days', 'Active case pending', 'Planning ahead — no deadline', 'Unsure'] },
  ],
  'Criminal Defense': [
    { name: 'chargeType', label: 'Type of charge', type: 'select', options: ['Felony', 'Misdemeanor', 'DUI / DWI', 'Drug offense', 'Assault', 'Theft', 'Other'] },
    { name: 'courtDate', label: 'Court date (if known)', type: 'date' },
    { name: 'inCustody', label: 'Are you currently in custody?', type: 'select', options: ['Yes', 'No'] },
  ],
  'Employment Law': [
    { name: 'issueType', label: 'Type of issue', type: 'select', options: ['Wrongful termination', 'Discrimination', 'Harassment', 'Wage theft', 'Retaliation', 'Contract dispute', 'Other'], required: true },
    { name: 'stillEmployed', label: 'Are you still employed?', type: 'select', options: ['Yes', 'No — recently terminated', 'No — resigned'] },
    { name: 'incidentDate', label: 'When did this occur?', type: 'date' },
  ],
  'Workers Compensation': [
    { name: 'injuryDate', label: 'Date of injury', type: 'date', required: true },
    { name: 'reportedToEmployer', label: 'Did you report the injury to your employer?', type: 'select', options: ['Yes', 'No', 'Not yet'] },
    { name: 'claimFiled', label: 'Have you filed a workers comp claim?', type: 'select', options: ['Yes — claim open', 'Yes — claim denied', 'No'] },
  ],
  'Immigration': [
    { name: 'matterType', label: 'Type of matter', type: 'select', options: ['Green card / permanent residence', 'Visa application', 'Citizenship / naturalization', 'Deportation / removal defense', 'Asylum', 'DACA', 'Other'], required: true },
    { name: 'hasDeadline', label: 'Is there an upcoming deadline or hearing?', type: 'select', options: ['Yes — within 30 days', 'Yes — within 90 days', 'No immediate deadline'] },
  ],
};

/**
 * Get the extra fields for a given practice area. Returns [] for areas with no
 * specific fields (fall back to the generic form).
 */
function fieldsFor(practiceArea) {
  return AREA_FIELDS[practiceArea] || [];
}

module.exports = { PRACTICE_AREAS, AREA_FIELDS, fieldsFor };
