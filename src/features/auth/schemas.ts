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
