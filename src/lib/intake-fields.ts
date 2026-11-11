export type IntakeKey = 'basic_info' | 'medical_history' | 'additional_symptoms';

export type IntakeValues = Record<string, string | string[]>;

type Option = readonly [value: string, label: string];

interface Base {
  key: string;
  label: string;
  required?: boolean;
  hint?: string;
  when?: (values: IntakeValues) => boolean;
}

export type IntakeField =
  | (Base & { kind: 'text'; multiline?: boolean })
  | (Base & { kind: 'number'; integer?: boolean; feet?: boolean })
  | (Base & { kind: 'choice'; options: readonly Option[] })
  | (Base & { kind: 'checks'; groups: readonly { title?: string; options: readonly Option[] }[] })
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

const partnered = (v: IntakeValues) => Boolean(v.maritalStatus) && v.maritalStatus !== 'single';

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
    id: 'visit',
    key: 'medical_history',
    title: 'About this visit',
    fields: [
      { kind: 'text', key: 'majorComplaint', label: 'Major complaint', multiline: true },
      { kind: 'text', key: 'currentMedications', label: 'Current medications', multiline: true },
    ],
  },
  {
    id: 'diagnosed',
    key: 'medical_history',
    title: 'Have you ever been diagnosed with?',
    fields: [
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
              ['no_genitourinary', 'None'],
            ],
          },
        ],
      },
      { kind: 'text', key: 'otherConditions', label: 'Any other', multiline: true },
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

const isInput = (f: IntakeField) => f.kind !== 'bmi';

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

export function toValues(
  part: IntakePart,
  data: Record<string, unknown> | null,
  defaults?: Record<string, unknown>,
) {
  const source = { ...(defaults ?? {}), ...(data ?? {}) };
  const values: IntakeValues = {};
  for (const f of part.fields.filter(isInput)) {
    const raw = source[f.key];
    values[f.key] =
      f.kind === 'checks'
        ? Array.isArray(raw)
          ? raw.filter((v): v is string => typeof v === 'string')
          : []
        : raw === null || raw === undefined
          ? ''
          : String(raw);
  }
  return values;
}

export function missing(part: IntakePart, values: IntakeValues) {
  return part.fields
    .filter((f) => isInput(f) && f.required && visible(f, values))
    .filter((f) => {
      const v = values[f.key];
      return Array.isArray(v) ? v.length === 0 : !v?.trim();
    })
    .map((f) => f.key);
}

export function toApi(part: IntakePart, values: IntakeValues) {
  const body: Record<string, unknown> = {};
  for (const f of part.fields.filter(isInput)) {
    const v = values[f.key];
    const shown = visible(f, values);
    if (f.kind === 'checks') body[f.key] = shown && Array.isArray(v) ? v : [];
    else if (!shown || typeof v !== 'string' || !v.trim()) body[f.key] = null;
    else body[f.key] = f.kind === 'number' ? Number(v) : v.trim();
  }
  return body;
}

export function toggleCheck(current: string[], value: string, groupValues: readonly string[]) {
  if (current.includes(value)) return current.filter((v) => v !== value);
  const none = groupValues.find((v) => v.startsWith('no_'));
  if (value === none) return [...current.filter((v) => !groupValues.includes(v)), value];
  return [...current.filter((v) => v !== none), value];
}
