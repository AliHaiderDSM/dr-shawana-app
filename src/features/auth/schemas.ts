import { Platform } from 'react-native';
import { z } from 'zod';
import { isValidPhone } from '@/lib/phone';

export const DEVICE = Platform.OS === 'ios' ? 'iOS app' : Platform.OS === 'android' ? 'Android app' : 'App';

const phone = z
  .string()
  .trim()
  .min(1, 'Enter your phone number')
  .refine(isValidPhone, 'Enter the phone number the clinic has, e.g. 0300 1234567');

export const newPassword = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Use at most 72 characters')
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'Use both letters and numbers');

export const loginSchema = z.object({
  phone,
  password: z.string().min(1, 'Enter your password'),
});

export const activateSchema = z
  .object({
    phone,
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, 'Enter the 6-digit code from the clinic'),
    password: newPassword,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: 'Passwords do not match', path: ['confirm'] });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword,
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, { message: 'Passwords do not match', path: ['confirm'] })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: 'Choose a password different from the current one',
    path: ['newPassword'],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type ActivateValues = z.infer<typeof activateSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
