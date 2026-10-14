import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Pause, Play } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { errorMessage } from '@/lib/errors';
import { formatDuration } from '@/lib/format';
import { colors, icon, radius, space, touch } from '@/theme/tokens';

export function VoiceNote({ mine, load }: { mine: boolean; load: () => Promise<string> }) {
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const fg = mine ? colors.textInverse : colors.primary;
  const track = mine ? colors.onPrimarySoft : colors.surfaceMuted;
  const fill = mine ? colors.textInverse : colors.primary;
  const progress = status.duration > 0 ? Math.min(1, status.currentTime / status.duration) : 0;
  const busy = loading || (loaded && status.isBuffering && !status.playing);

  const toggle = async () => {
    if (status.playing) {
      player.pause();
      return;
    }
    try {
      await setAudioModeAsync({ playsInSilentMode: true });
      if (!loaded) {
        setLoading(true);
        player.replace({ uri: await load() });
        setLoaded(true);
      } else if (status.duration > 0 && status.currentTime >= status.duration - 0.25) {
        await player.seekTo(0);
      }
      player.play();
    } catch (error) {
      Alert.alert('Could not play the voice message', errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={status.playing ? 'Pause voice message' : 'Play voice message'}
        onPress={() => void toggle()}
        hitSlop={6}
        style={[styles.button, { backgroundColor: track }]}
      >
        {busy ? (
          <ActivityIndicator color={fg} />
        ) : status.playing ? (
          <Pause size={icon.md} color={fg} fill={fg} />
        ) : (
          <Play size={icon.md} color={fg} fill={fg} />
        )}
      </Pressable>
      <View style={styles.flex}>
        <View style={[styles.track, { backgroundColor: track }]}>
          <View style={[styles.fill, { backgroundColor: fill, width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <AppText variant="caption" style={{ color: mine ? colors.textInverseMuted : colors.textMuted }}>
          {loaded && status.duration > 0
            ? `${formatDuration(status.playing || progress > 0 ? status.currentTime : status.duration)}`
            : 'Voice message'}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minWidth: 200 },
  flex: { flex: 1, gap: space.xs },
  button: {
    width: touch.iconButton,
    height: touch.iconButton,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: { height: 4, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: 4, borderRadius: radius.pill },
});
