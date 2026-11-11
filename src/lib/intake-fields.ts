export type IntakeKey = 'basic_info' | 'medical_history' | 'additional_symptoms';

export type IntakeValues = Record<string, unknown>;

type Option = readonly [value: string, label: string];

interface Base {
  key: string;
  label: string;
  required?: boolean;
  hint?: string;
  when?: (values: IntakeValues) => boolean;
}

export interface SurgeryEntry {
  type: string;
  year: string;
}

export interface FamilyEntry {
  relative: string;
  who: string;
  conditions: string[];
  other: string;
}

export type IntakeField =
  | (Base & { kind: 'heading' })
  | (Base & { kind: 'text'; multiline?: boolean })
  | (Base & { kind: 'number'; integer?: boolean; feet?: boolean })
  | (Base & { kind: 'date' })
  | (Base & { kind: 'bool' })
  | (Base & { kind: 'choice'; options: readonly Option[] })
  | (Base & { kind: 'checks'; groups: readonly { title?: string; options: readonly Option[] }[] })
  | (Base & { kind: 'surgeries'; options: readonly Option[] })
  | (Base & { kind: 'family'; relatives: readonly Option[]; conditions: readonly Option[] })
  | (Base & { kind: 'bmi' });

export interface IntakePart {
  id: string;
  key: IntakeKey;
  title: string;
  fields: IntakeField[];
}

const YES_NO: readonly Option[] = [
  ['yes', 'Yes'],
  ['no', 'No'],
];

const YES_NO_OCCASIONAL: readonly Option[] = [
  ['yes', 'Yes'],
  ['no', 'No'],
  ['occasionally', 'Occasionally'],
];

const is = (key: string, value: string) => (v: IntakeValues) => v[key] === value;
const partnered = (v: IntakeValues) => Boolean(v.maritalStatus) && v.maritalStatus !== 'single';
const NONE_SURGERY = 'no_surgery';

export const INTAKE_PARTS: IntakePart[] = [
  {
    id: 'basic',
    key: 'basic_info',
    title: 'Basic information',
    fields: [
      { kind: 'text', key: 'name', label: 'Name', required: true },
      { kind: 'number', key: 'age', label: 'Age', required: true, integer: true },
      { kind: 'text', key: 'city', label: 'City', required: true },
      { kind: 'text', key: 'country', label: 'Country', required: true },
      { kind: 'number', key: 'weightKg', label: 'Weight in KGs', required: true },
      {
        kind: 'number',
        key: 'heightFeet',
        label: 'Height in feet',
        required: true,
        feet: true,
        hint: 'Type 54 for 5.4 ft; the point is added for you',
      },
      { kind: 'bmi', key: 'bmi', label: 'BMI' },
      { kind: 'text', key: 'waistCircumference', label: 'Waist circumference' },
      {
        kind: 'choice',
        key: 'maritalStatus',
        label: 'Marital status',
        required: true,
        options: [
          ['single', 'Single'],
          ['married', 'Married'],
          ['divorced', 'Divorced'],
          ['widowed', 'Widowed'],
        ],
      },
      { kind: 'text', key: 'marriedYears', label: 'For how many years?', required: true, when: partnered },
      { kind: 'choice', key: 'hasKids', label: 'Kids', required: true, options: YES_NO, when: partnered },
      {
        kind: 'text',
        key: 'kidsDetails',
        label: 'How many children?',
        required: true,
        when: (v) => partnered(v) && v.hasKids === 'yes',
      },
      { kind: 'text', key: 'education', label: 'Education' },
      { kind: 'text', key: 'occupation', label: 'Occupation' },
    ],
  },
  {
    id: 'history',
    key: 'medical_history',
    title: 'Medical history',
    fields: [
      { kind: 'text', key: 'majorComplaint', label: 'Major complaint', multiline: true },
      { kind: 'heading', key: 'h-hormones', label: 'Hormones, contraception and periods' },
      {
        kind: 'choice',
        key: 'hormoneTherapy',
        label: 'Have you ever used hormone therapy?',
        options: [
          ['never', 'Never'],
          ['currently_using', 'Currently using'],
          ['previously_used', 'Previously used'],
        ],
      },
      { kind: 'text', key: 'hormonesUsed', label: 'Which hormones have you used?', multiline: true },
      {
        kind: 'choice',
        key: 'contraception',
        label: 'Are you using any form of contraception?',
        options: [
          ['yes', 'Yes'],
          ['no', 'No'],
          ['not_needed', 'Not needed'],
        ],
      },
      { kind: 'choice', key: 'havingPeriods', label: 'Are you still having periods?', options: YES_NO },
      {
        kind: 'date',
        key: 'lastPeriodDate',
        label: 'Last menstrual period date',
        required: true,
        hint: 'Day-month-year, e.g. 05-10-2026',
        when: is('havingPeriods', 'yes'),
      },
      {
        kind: 'choice',
        key: 'cycle',
        label: 'Cycle',
        required: true,
        options: [
          ['regular', 'Regular'],
          ['irregular', 'Irregular'],
        ],
        when: is('havingPeriods', 'yes'),
      },
      {
        kind: 'choice',
        key: 'flow',
        label: 'Periods flow',
        options: [
          ['normal', 'Normal'],
          ['heavy', 'Heavy'],
          ['low', 'Low'],
        ],
        when: (v) => v.havingPeriods === 'yes' && Boolean(v.cycle),
      },
      {
        kind: 'bool',
        key: 'dub',
        label: 'DUB (Dysfunctional Uterine Bleed)',
        when: is('cycle', 'irregular'),
      },
      {
        kind: 'bool',
        key: 'oligomenorrhea',
        label: 'Oligomenorrhea (Infrequent)',
        when: is('cycle', 'irregular'),
      },
      {
        kind: 'text',
        key: 'periodsNote',
        label: 'Periods note',
        multiline: true,
        when: is('havingPeriods', 'no'),
      },
      {
        kind: 'choice',
        key: 'menopauseDiagnosed',
        label: 'Have you been diagnosed with menopause?',
        options: YES_NO,
      },
      { kind: 'text', key: 'menopauseDiagnosedAge', label: 'Age at which menopause was diagnosed' },
      {
        kind: 'checks',
        key: 'conditions',
        label: 'Have you ever had any of the following medical conditions?',
        groups: [
          {
            title: 'Cancer',
            options: [
              ['breast_cancer', 'Breast Cancer'],
              ['endometrial_cancer', 'Endometrial Cancer'],
              ['ovarian_cancer', 'Ovarian Cancer'],
              ['brca', 'BRCA 1 / BRCA 2'],
              ['lynch_syndrome', 'Lynch Syndrome'],
              ['other_cancer', 'Any Other Cancer'],
              ['no_cancer', 'None'],
            ],
          },
          {
            title: 'Hormonal',
            options: [
              ['hyperthyroidism', 'Hyperthyroidism'],
              ['hypothyroidism', 'Hypothyroidism'],
              ['endometriosis', 'Endometriosis'],
              ['pms', 'Premenstrual Syndrome (PMS)'],
              ['pcos', 'Polycystic Ovary Syndrome (PCOS)'],
              ['no_hormonal', 'None'],
            ],
          },
          {
            title: 'Metabolic',
            options: [
              ['diabetes', 'Diabetes'],
              ['insulin_resistance', 'Insulin Resistance'],
              ['dyslipidemia', 'Dyslipidemia'],
              ['nafld', 'NAFLD'],
              ['no_metabolic', 'None'],
            ],
          },
          {
            title: 'Musculoskeletal',
            options: [
              ['osteopenia', 'Osteopenia'],
              ['osteoporosis', 'Osteoporosis'],
              ['osteoarthritis', 'Osteoarthritis'],
              ['rheumatoid_arthritis', 'Rheumatoid Arthritis'],
              ['gout', 'Gout'],
              ['no_musculoskeletal', 'None'],
            ],
          },
          {
            title: 'Cardiac',
            options: [
              ['heart_disease', 'Heart Disease'],
              ['hypertension', 'Hypertension'],
              ['dvt', 'Deep Vein Thrombosis (DVT)'],
              ['pulmonary_embolism', 'Pulmonary Embolism'],
              ['tia', 'TIA'],
              ['no_cardiac', 'None'],
            ],
          },
          {
            title: 'Mental',
            options: [
              ['anxiety', 'Anxiety'],
              ['depression', 'Depression'],
              ['chronic_fatigue_me', 'Chronic Fatigue/ME (+Fibromyalgia)'],
              ['pnd', 'Post-natal Depression (PND)'],
              ['pmdd', 'Premenstrual Dysphoric Disorder (PMDD)'],
              ['no_mental', 'None'],
            ],
          },
          {
            title: 'Neurological',
            options: [
              ['migraine', 'Migraine or Severe Headaches'],
              ['epilepsy', 'Epilepsy'],
              ['multiple_sclerosis', 'Multiple Sclerosis'],
              ['memory_issues', 'Memory Issues'],
              ['stroke', 'Stroke'],
              ['no_neurological', 'None'],
            ],
          },
          {
            title: 'Autoimmune',
            options: [
              ['lupus_sle', 'Lupus / SLE'],
              ['skin_disease', 'Any Skin Disease'],
              ['no_autoimmune', 'None'],
            ],
          },
          {
            title: 'Liver / GI',
            options: [
              ['liver_disease', 'Liver Disease'],
              ['chronic_reflux', 'Chronic Reflux'],
              ['celiac_disease', 'Celiac Disease'],
              ['ibs', 'IBS'],
              ['h_pylori', 'H - Pylori'],
              ['no_liver_gi', 'None'],
            ],
          },
          {
            title: 'Genitourinary',
            options: [
              ['recurrent_uti', 'Recurrent UTI'],
              ['vaginal_infections', 'Vaginal Infections'],
              ['std', 'STD'],
              ['no_genitourinary', 'None'],
            ],
          },
        ],
      },
      { kind: 'text', key: 'otherConditions', label: 'Any other', multiline: true },
      {
        kind: 'surgeries',
        key: 'surgeries',
        label: 'Surgical history',
        options: [
          ['hysterectomy', 'Hysterectomy'],
          ['ovaries_removed', 'Ovaries Removed'],
          ['c_section', 'C-Section'],
          ['tubal_ligation', 'Tubal Ligation'],
          ['myomectomy', 'Myomectomy'],
          ['endometriosis_surgery', 'Endometriosis Surgery'],
          ['breast_surgery', 'Breast Surgery'],
          ['bariatric_surgery', 'Bariatric Surgery'],
          ['other', 'Other'],
          [NONE_SURGERY, 'None'],
        ],
      },
      {
        kind: 'text',
        key: 'otherSurgery',
        label: 'Other surgery',
        when: (v) =>
          Array.isArray(v.surgeries) && (v.surgeries as SurgeryEntry[]).some((s) => s.type === 'other'),
      },
      {
        kind: 'heading',
        key: 'h-family',
        label: 'Family history',
        hint: 'Has your mother, father, sister, or another close family member ever been diagnosed with any of the following conditions?',
      },
      {
        kind: 'family',
        key: 'familyHistory',
        label: 'Family members',
        relatives: [
          ['mother', 'Mother'],
          ['father', 'Father'],
          ['sister', 'Sister'],
          ['close_family', 'Any Close Family Member'],
        ],
        conditions: [
          ['breast_cancer', 'Breast Cancer'],
          ['ovarian_cancer', 'Ovarian Cancer'],
          ['endometrial_cancer', 'Endometrial Cancer'],
          ['osteoporosis', 'Osteoporosis'],
          ['hip_fracture', 'Hip Fracture'],
          ['heart_disease', 'Heart Disease'],
          ['hypertension', 'Hypertension'],
          ['diabetes', 'Diabetes'],
          ['early_menopause', 'Early Menopause'],
          ['dementia', 'Dementia'],
          ['other', 'Other'],
        ],
      },
      { kind: 'heading', key: 'h-medications', label: 'Medications, allergies and lifestyle' },
      { kind: 'text', key: 'currentMedications', label: 'Current medications', multiline: true },
      {
        kind: 'choice',
        key: 'hasAllergies',
        label: 'Any allergies to medications, foods or other substances?',
        options: YES_NO,
      },
      {
        kind: 'text',
        key: 'allergies',
        label: 'Allergy details',
        required: true,
        multiline: true,
        when: is('hasAllergies', 'yes'),
      },
      { kind: 'choice', key: 'alcohol', label: 'Do you take alcohol?', options: YES_NO_OCCASIONAL },
      { kind: 'choice', key: 'smoking', label: 'Do you smoke?', options: YES_NO_OCCASIONAL },
      { kind: 'choice', key: 'exercise', label: 'Do you exercise regularly?', options: YES_NO_OCCASIONAL },
      {
        kind: 'choice',
        key: 'followsDiet',
        label: 'Are you following a specific diet plan?',
        options: YES_NO,
      },
      { kind: 'text', key: 'dietName', label: 'Diet name', required: true, when: is('followsDiet', 'yes') },
      {
        kind: 'checks',
        key: 'relationship',
        label: 'Relationship status',
        groups: [
          {
            options: [
              ['abusive', 'Abusive'],
              ['conflicted', 'Conflicted'],
              ['healthy', 'Healthy'],
            ],
          },
        ],
      },
      {
        kind: 'text',
        key: 'relationshipSituation',
        label: 'What is your current relationship situation?',
        multiline: true,
      },
    ],
  },
  {
    id: 'symptoms',
    key: 'additional_symptoms',
    title: 'Other symptoms you are experiencing',
    fields: [
      {
        kind: 'checks',
        key: 'symptoms',
        label: 'Tick every symptom you have',
        groups: [
          {
            options: [
              ['hair_loss', 'Hair Loss'],
              ['tinnitus', 'Ear Ringing'],
              ['weight_gain', 'Weight Gain'],
              ['belly_fat', 'Belly Fat'],
              ['weight_loss', 'Weight Loss'],
              ['frozen_shoulder', 'Frozen Shoulder'],
              ['marital_conflicts', 'Marital Conflicts'],
              ['vaginal_itching', 'Vaginal Itching'],
              ['recurrent_utis', 'Recurrent UTIs'],
              ['skin_issues', 'Skin issues'],
              ['headaches', 'Headaches'],
              ['dizziness_vertigo', 'Dizziness / Vertigo'],
              ['lack_of_tolerance', 'Lack of tolerance / Rage'],
            ],
          },
        ],
      },
    ],
  },
];

const isInput = (f: IntakeField) => f.kind !== 'bmi' && f.kind !== 'heading';

export const visible = (f: IntakeField, values: IntakeValues) => !f.when || f.when(values);

export function feetInput(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 3);
  return digits.length > 1 ? `${digits[0]}.${digits.slice(1)}` : digits;
}

export function numberInput(raw: string, integer?: boolean) {
  if (integer) return raw.replace(/\D/g, '').slice(0, 3);
  const cleaned = raw.replace(/[^\d.]/g, '');
  const [whole = '', ...rest] = cleaned.split('.');
  return rest.length ? `${whole.slice(0, 3)}.${rest.join('').slice(0, 2)}` : whole.slice(0, 3);
}

export function dateInput(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

const isoToDisplay = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : iso;
};

export function displayToIso(display: string) {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(display);
  if (!m) return null;
  const [, d, mo, y] = m;
  const date = new Date(`${y}-${mo}-${d}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.getUTCDate() !== Number(d)) return null;
  return `${y}-${mo}-${d}`;
}

export function bmiOf(values: IntakeValues) {
  const weight = Number(values.weightKg);
  const meters = Number(values.heightFeet) * 0.3048;
  if (!(weight > 0) || !(meters > 0)) return null;
  const bmi = weight / (meters * meters);
  const label =
    bmi < 18.5
      ? 'Underweight'
      : bmi < 25
        ? 'Normal weight'
        : bmi < 30
          ? 'Overweight'
          : bmi < 35
            ? 'Obesity'
            : 'Severe obesity';
  return { value: bmi.toFixed(1), label };
}

const text = (raw: unknown) => (raw === null || raw === undefined ? '' : String(raw));

export function toValues(
  part: IntakePart,
  data: Record<string, unknown> | null,
  defaults?: Record<string, unknown>,
) {
  const source = { ...(defaults ?? {}), ...(data ?? {}) };
  const values: IntakeValues = {};
  for (const f of part.fields.filter(isInput)) {
    const raw = source[f.key];
    switch (f.kind) {
      case 'checks':
        values[f.key] = Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : [];
        break;
      case 'bool':
        values[f.key] = raw === true;
        break;
      case 'date':
        values[f.key] = typeof raw === 'string' ? isoToDisplay(raw) : '';
        break;
      case 'surgeries':
        values[f.key] = Array.isArray(raw)
          ? (raw as { type?: unknown; year?: unknown }[])
              .filter((s) => typeof s?.type === 'string')
              .map((s) => ({ type: String(s.type), year: text(s.year) }))
          : [];
        break;
      case 'family':
        values[f.key] = Array.isArray(raw)
          ? (raw as Partial<FamilyEntry>[])
              .filter((e) => typeof e?.relative === 'string')
              .map((e) => ({
                relative: String(e.relative),
                who: text(e.who),
                conditions: Array.isArray(e.conditions) ? e.conditions.map(String) : [],
                other: text(e.other),
              }))
          : [];
        break;
      default:
        values[f.key] = text(raw);
    }
  }
  return values;
}

export function problems(part: IntakePart, values: IntakeValues) {
  const result: Record<string, string> = {};
  for (const f of part.fields) {
    if (!isInput(f) || !visible(f, values)) continue;
    const v = values[f.key];
    const empty = Array.isArray(v) ? v.length === 0 : typeof v === 'string' ? !v.trim() : !v;
    if (f.required && empty) result[f.key] = 'Required';
    else if (f.kind === 'date' && typeof v === 'string' && v.trim() && !displayToIso(v.trim()))
      result[f.key] = 'Use day-month-year, e.g. 05-10-2026';
    else if (f.kind === 'surgeries' && Array.isArray(v)) {
      const bad = (v as SurgeryEntry[]).find((s) => s.year && !/^(19|20)\d{2}$/.test(s.year));
      if (bad) result[f.key] = 'Write the year with 4 digits, e.g. 2015';
    }
  }
  return result;
}

export function missing(part: IntakePart, values: IntakeValues) {
  return Object.entries(problems(part, values))
    .filter(([, message]) => message === 'Required')
    .map(([key]) => key);
}

export function toApi(part: IntakePart, values: IntakeValues) {
  const body: Record<string, unknown> = {};
  for (const f of part.fields.filter(isInput)) {
    const v = values[f.key];
    const shown = visible(f, values);
    switch (f.kind) {
      case 'checks':
        body[f.key] = shown && Array.isArray(v) ? v : [];
        break;
      case 'bool':
        body[f.key] = shown && v === true;
        break;
      case 'surgeries':
        body[f.key] =
          shown && Array.isArray(v)
            ? (v as SurgeryEntry[]).map((s) => ({
                type: s.type,
                year: s.type !== NONE_SURGERY && s.year ? Number(s.year) : null,
              }))
            : [];
        break;
      case 'family':
        body[f.key] =
          shown && Array.isArray(v)
            ? (v as FamilyEntry[])
                .filter((e) => e.conditions.length > 0 || e.who.trim())
                .map((e) => ({
                  relative: e.relative,
                  who: e.who.trim() || null,
                  conditions: e.conditions,
                  other: e.conditions.includes('other') ? e.other.trim() || null : null,
                }))
            : [];
        break;
      case 'date':
        body[f.key] = shown && typeof v === 'string' && v.trim() ? displayToIso(v.trim()) : null;
        break;
      default:
        if (!shown || typeof v !== 'string' || !v.trim()) body[f.key] = null;
        else body[f.key] = f.kind === 'number' ? Number(v) : v.trim();
    }
  }
  return body;
}

export function toggleCheck(current: string[], value: string, groupValues: readonly string[]) {
  if (current.includes(value)) return current.filter((v) => v !== value);
  const none = groupValues.find((v) => v.startsWith('no_'));
  if (value === none) return [...current.filter((v) => !groupValues.includes(v)), value];
  return [...current.filter((v) => v !== none), value];
}

export function toggleSurgery(current: SurgeryEntry[], type: string) {
  if (current.some((s) => s.type === type)) return current.filter((s) => s.type !== type);
  if (type === NONE_SURGERY) return [{ type, year: '' }];
  return [...current.filter((s) => s.type !== NONE_SURGERY), { type, year: '' }];
}

export const isNoneSurgery = (type: string) => type === NONE_SURGERY;

export function updateFamily(current: FamilyEntry[], relatives: readonly Option[], next: FamilyEntry) {
  const order = relatives.map(([v]) => v);
  const rest = current.filter((e) => e.relative !== next.relative);
  return [...rest, next].sort((a, b) => order.indexOf(a.relative) - order.indexOf(b.relative));
}
