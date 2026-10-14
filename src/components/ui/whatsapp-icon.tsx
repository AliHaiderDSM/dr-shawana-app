import Svg, { G, Path } from 'react-native-svg';

export function WhatsAppIcon({ size = 28, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Path
        d="M12 2.4a9.6 9.6 0 0 0-8.24 14.53L2.4 21.6l4.82-1.3A9.6 9.6 0 1 0 12 2.4z"
        fill="none"
        stroke={color}
        strokeWidth={1.9}
        strokeLinejoin="round"
      />
      <G transform="translate(7.05 7.05) scale(0.42)">
        <Path
          d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
          fill={color}
        />
      </G>
    </Svg>
  );
}
