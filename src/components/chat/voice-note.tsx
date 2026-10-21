import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Pause, Play } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { errorMessage } from '@/lib/errors';
import { formatDuration } from '@/lib/format';
import { colors, icon, radius, space, touch } from '@/theme/tokens';

let current: { owner: object; pause: () => void } | null = null;

function takeOver(owner: object, pause: () => void) {
  if (current && current.owner !== owner) current.pause();
  current = { owner, pause };
}

export function VoiceNote({
  mine,
  load,
  durationMs,
}: {
  mine: boolean;
  load: () => Promise<string>;
  durationMs?: number | null;
}) {
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const [owner] = useState(() => ({}));

  useEffect(
    () => () => {
      if (current?.owner === owner) current = null;
    },
    [owner],
  );
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [heard, setHeard] = useState(0);
  const [learned, setLearned] = useState(0);
  const [finished, setFinished] = useState(false);
  const fg = mine ? colors.textInverse : colors.primary;
  const track = mine ? colors.onPrimarySoft : colors.surfaceMuted;
  const fill = mine ? colors.textInverse : colors.primary;
  if (status.currentTime > heard) setHeard(status.currentTime);
  const [endSignal, setEndSignal] = useState(false);
  if (status.didJustFinish !== endSignal) {
    setEndSignal(status.didJustFinish);
    if (status.didJustFinish) {
      setFinished(true);
      setLearned(Math.max(heard, status.currentTime));
    }
  }
  const known = durationMs ? durationMs / 1000 : 0;
  const reported = Number.isFinite(status.duration) && status.duration > 1 ? status.duration : 0;
  const trusted = reported > 0 && heard <= reported + 0.3 ? reported : 0;
  const length = known || learned || trusted;
  const atEnd = finished && !status.playing;
  const progress = atEnd
    ? 1
    : length > 0
      ? Math.min(1, status.currentTime / length)
      : status.currentTime > 0
        ? status.currentTime / (status.currentTime + 3)
        : 0;
  const moving = status.playing || (progress > 0 && progress < 1);
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
      } else if (finished || (length > 0 && status.currentTime >= length - 0.25)) {
        await player.seekTo(0);
      }
      setFinished(false);
      takeOver(owner, () => player.pause());
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
          {length > 0
            ? formatDuration(moving && !atEnd ? status.currentTime : length)
            : status.currentTime > 0
              ? formatDuration(status.currentTime)
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
