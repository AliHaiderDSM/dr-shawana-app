import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { brand } from '@/theme/tokens';

export function HeroGradient({ from = brand.heroStart, to = brand.heroEnd }: { from?: string; to?: string }) {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={from} />
          <Stop offset="1" stopColor={to} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#hero)" />
    </Svg>
  );
}
