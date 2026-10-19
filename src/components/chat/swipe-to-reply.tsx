import { Reply } from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import { colors, icon, radius, space } from '@/theme/tokens';

const TRIGGER = 64;
const MAX_PULL = 88;

export function SwipeToReply({ children, onReply }: { children: ReactNode; onReply: () => void }) {
  const [offset] = useState(() => new Animated.Value(0));
  const responder = useMemo(() => {
    const settle = () =>
      Animated.spring(offset, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => g.dx > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
      onPanResponderMove: (_e, g) => offset.setValue(Math.max(0, Math.min(g.dx, MAX_PULL))),
      onPanResponderRelease: (_e, g) => {
        if (g.dx >= TRIGGER) onReply();
        settle();
      },
      onPanResponderTerminate: settle,
      onPanResponderTerminationRequest: () => false,
    });
  }, [offset, onReply]);
  const [hint] = useState(() =>
    offset.interpolate({ inputRange: [0, TRIGGER], outputRange: [0, 1], extrapolate: 'clamp' }),
  );

  return (
    <View>
      <View pointerEvents="none" style={styles.hintLane}>
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
  hintLane: { position: 'absolute', left: space.xs, top: 0, bottom: 0, justifyContent: 'center' },
  hint: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
