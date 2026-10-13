export function isValidPhone(raw: string) {
  let digits = raw.replace(/\D+/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = `92${digits.slice(1)}`;
  else if (digits.length === 10 && digits.startsWith('3')) digits = `92${digits}`;
  return digits.length >= 10 && digits.length <= 15;
}
