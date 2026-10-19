import { Asset } from 'expo-asset';
import {
  cacheDirectory,
  deleteAsync,
  EncodingType,
  getInfoAsync,
  moveAsync,
  readAsStringAsync,
} from 'expo-file-system/legacy';
import { printToFileAsync } from 'expo-print';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import type { PatientProfile } from '@/redux/features/patient';
import type { PrescriptionDetail } from '@/redux/features/prescriptions';
import { formatDate, htmlToText } from './format';
import { PRESCRIPTION_CATEGORY_LABELS } from './labels';

const escape = (value: string | null | undefined) =>
  (value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const multiline = (value: string | null | undefined) => escape(value).replace(/\n/g, '<br>');

async function logoDataUri() {
  try {
    const asset = Asset.fromModule(require('../../assets/logo.png'));
    await asset.downloadAsync();
    if (!asset.localUri) return null;
    const base64 = await readAsStringAsync(asset.localUri, { encoding: EncodingType.Base64 });
    return `data:image/png;base64,${base64}`;
  } catch {
    return null;
  }
}

function buildHtml(p: PrescriptionDetail, patient: PatientProfile | undefined, logo: string | null) {
  const groups = new Map<string, PrescriptionDetail['items']>();
  for (const item of p.items) {
    const key = PRESCRIPTION_CATEGORY_LABELS[item.category] ?? 'Other';
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  const clinic = patient?.clinic;
  const plan = htmlToText(p.planTreatment);
  const field = (label: string, value: string | null | undefined) =>
    value ? `<div><span class="muted">${label}: </span><strong>${escape(value)}</strong></div>` : '';

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Roboto, "Segoe UI", Arial, sans-serif; color: #0F1F24; font-size: 12px; line-height: 1.5; margin: 0; }
  header { display: flex; justify-content: space-between; align-items: center; gap: 16px; border-bottom: 2px solid #0B6E66; padding-bottom: 12px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand img { height: 52px; width: auto; }
  .clinic { font-size: 16px; font-weight: 700; }
  .muted { color: #55666C; }
  .small { font-size: 11px; }
  .title { text-align: right; }
  .title .word { font-size: 15px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; margin-top: 14px; }
  .block { margin-top: 14px; page-break-inside: avoid; }
  .heading { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; border-bottom: 1px solid #DDE4E5; padding-bottom: 4px; margin-bottom: 6px; }
  ol { margin: 0; padding-left: 20px; }
  li { margin-bottom: 6px; }
  .note { font-size: 11px; color: #55666C; }
  footer { margin-top: 28px; border-top: 1px solid #DDE4E5; padding-top: 8px; font-size: 10px; color: #55666C; text-align: center; }
</style>
</head>
<body>
  <header>
    <div class="brand">
      ${logo ? `<img src="${logo}" alt="">` : ''}
      <div>
        <div class="clinic">${escape(clinic?.name ?? 'Dr Shawana Mufti DSM')}</div>
        ${clinic?.address ? `<div class="muted small">${escape(clinic.address)}</div>` : ''}
        ${clinic?.phone ? `<div class="muted small">${escape(clinic.phone)}</div>` : ''}
      </div>
    </div>
    <div class="title">
      <div class="word">Prescription</div>
      <div class="muted small">No ${p.prescriptionNo}</div>
    </div>
  </header>
  <div class="grid">
    ${field('Patient', patient?.name)}
    ${field('Date', formatDate(p.date))}
    ${field('City', patient?.city)}
    ${field('Doctor', p.doctor)}
  </div>
  ${p.diagnosis?.trim() ? `<div class="block"><span class="muted">Diagnosis: </span><strong>${multiline(p.diagnosis.trim())}</strong></div>` : ''}
  ${[...groups]
    .map(
      ([group, items]) => `<div class="block">
    <div class="heading">${escape(group)}</div>
    <ol>
      ${items
        .map(
          (item) =>
            `<li><strong>${escape(item.name)}</strong>${item.dose ? ` · ${escape(item.dose)}` : ''}${
              item.optional ? ' <span class="muted">(optional)</span>' : ''
            }${item.instructions ? `<div class="note">${multiline(item.instructions)}</div>` : ''}</li>`,
        )
        .join('')}
    </ol>
  </div>`,
    )
    .join('')}
  ${plan || p.followupDate ? `<div class="block"><div class="heading">Plan of treatment</div>${plan ? `<div>${multiline(plan)}</div>` : ''}${p.followupDate ? field('Follow up', formatDate(p.followupDate)) : ''}</div>` : ''}
  <footer>Take medicines only as your doctor advised.</footer>
</body>
</html>`;
}

export async function sharePrescriptionPdf(p: PrescriptionDetail, patient: PatientProfile | undefined) {
  const html = buildHtml(p, patient, await logoDataUri());
  const { uri } = await printToFileAsync({ html, width: 595, height: 842 });
  const target = `${cacheDirectory ?? ''}Prescription-${p.prescriptionNo}.pdf`;
  await deleteAsync(target, { idempotent: true }).catch(() => undefined);
  const moved = await moveAsync({ from: uri, to: target })
    .then(() => true)
    .catch(() => false);
  const file = moved && (await getInfoAsync(target)).exists ? target : uri;
  if (!(await isAvailableAsync())) throw new Error('Sharing is not available on this phone.');
  await shareAsync(file, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: `Prescription ${p.prescriptionNo}`,
  });
}
