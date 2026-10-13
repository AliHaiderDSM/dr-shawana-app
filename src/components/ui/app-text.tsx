import { StyleSheet, Text, type TextProps } from 'react-native';
import { colors, fontSize, fontWeight, lineHeight, maxFontScale } from '@/theme/tokens';

type Variant = 'title' | 'heading' | 'subheading' | 'body' | 'label' | 'caption';
type Tone = 'default' | 'muted' | 'primary' | 'inverse' | 'danger' | 'success' | 'warning';

interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  weight?: keyof typeof fontWeight;
  center?: boolean;
}

const toneColor: Record<Tone, string> = {
  default: colors.text,
  muted: colors.textMuted,
  primary: colors.primary,
  inverse: colors.textInverse,
  danger: colors.danger,
  success: colors.success,
  warning: colors.warning,
};

export function AppText({
  variant = 'body',
  tone = 'default',
  weight,
  center,
  style,
  maxFontSizeMultiplier = maxFontScale,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        styles[variant],
        { color: toneColor[tone] },
        weight ? { fontWeight: fontWeight[weight] } : null,
        center ? styles.center : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.xxl, lineHeight: lineHeight.xxl, fontWeight: fontWeight.bold },
  heading: { fontSize: fontSize.xl, lineHeight: lineHeight.xl, fontWeight: fontWeight.semibold },
  subheading: { fontSize: fontSize.lg, lineHeight: lineHeight.lg, fontWeight: fontWeight.semibold },
  body: { fontSize: fontSize.md, lineHeight: lineHeight.md },
  label: { fontSize: fontSize.sm, lineHeight: lineHeight.sm, fontWeight: fontWeight.medium },
  caption: { fontSize: fontSize.xs, lineHeight: lineHeight.xs },
  center: { textAlign: 'center' },
});
