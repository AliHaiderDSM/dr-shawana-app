import { Platform } from 'react-native';

export const brand = {
  primary: '#3B6FE0',
  primaryDark: '#2F5FCB',
  primaryDeep: '#1D44A3',
  primaryTint: '#EDF3FF',
  heroStart: '#2B5ACC',
  heroEnd: '#4A7FE6',
  green: '#1B7A48',
  greenTint: '#E3F6EA',
  ink: '#1E2533',
  inkMuted: '#626872',
  paper: '#F9FAFC',
  paperMuted: '#F2F4F7',
  line: '#E1E4E9',
} as const;

export const colors = {
  background: brand.paper,
  surface: '#FFFFFF',
  surfaceMuted: brand.paperMuted,
  border: brand.line,
  text: brand.ink,
  textMuted: brand.inkMuted,
  textInverse: '#FFFFFF',
  textInverseMuted: 'rgba(255, 255, 255, 0.82)',
  onPrimarySoft: 'rgba(255, 255, 255, 0.18)',
  primary: brand.primary,
  primaryPressed: brand.primaryDark,
  primarySoft: brand.primaryTint,
  primarySoftText: brand.primaryDeep,
  accent: brand.green,
  accentSoft: brand.greenTint,
  success: brand.green,
  successSoft: brand.greenTint,
  warning: '#9A4A04',
  warningSoft: '#FDF1E3',
  danger: '#C8261B',
  dangerSoft: '#FDECEA',
  info: '#1F5BB8',
  infoSoft: '#E8F0FC',
  neutralSoft: '#EEF1F5',
  overlay: 'rgba(30, 37, 51, 0.45)',
  skeleton: '#E6EAF0',
  heroAccent: 'rgba(255, 255, 255, 0.08)',
} as const;

export const chart = [brand.primary, '#D9822B', brand.green, '#7E57C2', '#C2185B'] as const;

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
