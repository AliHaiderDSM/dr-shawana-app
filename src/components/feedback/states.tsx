import { AlertTriangle, WifiOff, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View, type DimensionValue } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { errorMessage, isOffline } from '@/lib/errors';
import { colors, radius, space } from '@/theme/tokens';

export function EmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.box} accessibilityRole="summary">
      <View style={styles.iconWrap}>
        <Icon size={28} color={colors.primary} />
      </View>
      <AppText variant="subheading" center>
        {title}
      </AppText>
      {message ? (
        <AppText tone="muted" center>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" fullWidth={false} />
      ) : null}
    </View>
  );
}

export function ErrorState({
  error,
  onRetry,
  retrying,
}: {
  error: unknown;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  const offline = isOffline(error);
  return (
    <View style={styles.box} accessibilityRole="alert">
      <View style={[styles.iconWrap, styles.errorIcon]}>
        {offline ? (
          <WifiOff size={28} color={colors.danger} />
        ) : (
          <AlertTriangle size={28} color={colors.danger} />
        )}
      </View>
      <AppText variant="subheading" center>
        {offline ? 'You are offline' : 'Could not load this'}
      </AppText>
      <AppText tone="muted" center>
        {errorMessage(error)}
      </AppText>
      {onRetry ? (
        <Button
          label="Try again"
          onPress={onRetry}
          loading={retrying}
          variant="secondary"
          fullWidth={false}
        />
      ) : null}
    </View>
  );
}

export function SkeletonBlock({ height = 16, width = '100%' }: { height?: number; width?: DimensionValue }) {
  const [opacity] = useState(() => new Animated.Value(0.6));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.6, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[styles.skeleton, { height, width, opacity }]} />;
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list} accessibilityLabel="Loading" accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.card}>
          <SkeletonBlock width="45%" height={14} />
          <SkeletonBlock width="80%" height={18} />
          <SkeletonBlock width="60%" height={14} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: space.md, paddingVertical: space.xxxl, paddingHorizontal: space.lg },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: { backgroundColor: colors.dangerSoft },
  skeleton: { backgroundColor: colors.skeleton, borderRadius: radius.sm },
  list: { gap: space.md },
  card: {
    gap: space.sm,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
