import { Platform } from 'react-native';
import { z } from 'zod';
import { isValidPhone } from '@/lib/phone';

export const DEVICE = Platform.OS === 'ios' ? 'iOS app' : Platform.OS === 'android' ? 'Android app' : 'App';

export const loginSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, 'Enter your phone number')
    .refine(isValidPhone, 'Enter the phone number the clinic has, e.g. 0300 1234567'),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit code from the clinic'),
});

export type LoginValues = z.infer<typeof loginSchema>;

const phoneField = loginSchema.shape.phone;
const codeField = loginSchema.shape.code;

export const newPassword = z
  .string()
  .min(6, 'Use at least 6 characters')
  .max(72, 'Use at most 72 characters')
  .refine((v) => v.trim().length === v.length, 'Do not start or end with a space');

export const passwordLoginSchema = z.object({
  phone: phoneField,
  password: z.string().min(1, 'Enter your password').max(72),
});

export type PasswordLoginValues = z.infer<typeof passwordLoginSchema>;

export const resetPasswordSchema = z
  .object({ phone: phoneField, code: codeField, password: newPassword, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'The two passwords are not the same',
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
