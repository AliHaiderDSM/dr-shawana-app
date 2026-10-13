import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, icon, radius, shadow, space } from '@/theme/tokens';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  chevron?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  chevron,
  style,
}: CardProps) {
  const body = (
    <View style={styles.row}>
      <View style={styles.body}>{children}</View>
      {chevron ? <ChevronRight size={icon.md} color={colors.textMuted} /> : null}
    </View>
  );
  if (!onPress) return <View style={[styles.card, style]}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.lg,
    ...shadow,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  body: { flex: 1, minWidth: 0, gap: space.sm },
});
