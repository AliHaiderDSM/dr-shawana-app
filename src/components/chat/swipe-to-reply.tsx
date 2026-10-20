import { Reply } from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import { colors, icon, radius, space } from '@/theme/tokens';

const TRIGGER = 64;
const MAX_PULL = 88;

export function SwipeToReply({
  children,
  onReply,
  fromRight = false,
}: {
  children: ReactNode;
  onReply: () => void;
  fromRight?: boolean;
}) {
  const [offset] = useState(() => new Animated.Value(0));
  const sign = fromRight ? -1 : 1;
  const responder = useMemo(() => {
    const settle = () =>
      Animated.spring(offset, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => sign * g.dx > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
      onPanResponderMove: (_e, g) => offset.setValue(sign * Math.max(0, Math.min(sign * g.dx, MAX_PULL))),
      onPanResponderRelease: (_e, g) => {
        if (sign * g.dx >= TRIGGER) onReply();
        settle();
      },
      onPanResponderTerminate: settle,
      onPanResponderTerminationRequest: () => false,
    });
  }, [offset, onReply, sign]);
  const hint = useMemo(
    () =>
      offset.interpolate({
        inputRange: fromRight ? [-TRIGGER, 0] : [0, TRIGGER],
        outputRange: fromRight ? [1, 0] : [0, 1],
        extrapolate: 'clamp',
      }),
    [offset, fromRight],
  );

  return (
    <View>
      <View pointerEvents="none" style={[styles.hintLane, fromRight ? styles.hintRight : styles.hintLeft]}>
        <Animated.View style={[styles.hint, { opacity: hint, transform: [{ scale: hint }] }]}>
          <Reply size={icon.md} color={colors.primary} />
        </Animated.View>
      </View>
      <Animated.View {...responder.panHandlers} style={{ transform: [{ translateX: offset }] }}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  hintLane: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center' },
  hintLeft: { left: space.xs },
  hintRight: { right: space.xs },
  hint: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
