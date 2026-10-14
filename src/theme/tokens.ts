import { Platform } from 'react-native';

export const colors = {
  background: '#F5F7F7',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF2F2',
  border: '#DDE4E5',
  text: '#0F1F24',
  textMuted: '#55666C',
  textInverse: '#FFFFFF',
  textInverseMuted: 'rgba(255, 255, 255, 0.8)',
  onPrimarySoft: 'rgba(255, 255, 255, 0.18)',
  primary: '#0B6E66',
  primaryPressed: '#085A53',
  primarySoft: '#E3F1EF',
  primarySoftText: '#08524C',
  success: '#067647',
  successSoft: '#E6F4EC',
  warning: '#9A4A04',
  warningSoft: '#FDF1E3',
  danger: '#B42318',
  dangerSoft: '#FDECEA',
  info: '#1F5BB8',
  infoSoft: '#E8F0FC',
  neutralSoft: '#EEF0F1',
  overlay: 'rgba(15, 31, 36, 0.45)',
  skeleton: '#E3E9EA',
  whatsapp: '#25D366',
  whatsappPressed: '#1DA851',
  heroAccent: 'rgba(255, 255, 255, 0.08)',
} as const;

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 26,
} as const;

export const lineHeight = {
  xs: 16,
  sm: 20,
  md: 22,
  lg: 24,
  xl: 28,
  xxl: 32,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const touch = {
  minHeight: 48,
  iconButton: 44,
} as const;

export const icon = {
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export const maxFontScale = 1.6;

export const shadow = Platform.select({
  ios: {
    shadowColor: '#0F1F24',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  default: { elevation: 1 },
});

export const contentMaxWidth = 640;
