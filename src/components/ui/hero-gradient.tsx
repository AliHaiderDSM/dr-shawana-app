import { useId, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { brand } from '@/theme/tokens';

export function HeroGradient({ from = brand.heroStart, to = brand.heroEnd }: { from?: string; to?: string }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [size, setSize] = useState({ width: 0, height: 0 });
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: from }]}
      onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      {size.width > 0 ? (
        <Svg width={size.width} height={size.height}>
          <Defs>
            <LinearGradient
              id={id}
              x1="0"
              y1="0"
              x2={size.width}
              y2={size.height * 0.6}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor={from} stopOpacity="1" />
              <Stop offset="1" stopColor={to} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={size.width} height={size.height} fill={`url(#${id})`} />
        </Svg>
      ) : null}
    </View>
  );
}
