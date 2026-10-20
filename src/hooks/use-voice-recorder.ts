import {
  getRecordingPermissionsAsync,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useState } from 'react';
import { Alert, Linking } from 'react-native';
import type { UploadableFile } from '@/types/api';
import { VOICE_TYPE } from '@/utils/files';

export const MAX_VOICE_SECONDS = 300;
const MIN_VOICE_MS = 800;

async function microphoneAllowed() {
  const current = await getRecordingPermissionsAsync();
  if (current.granted) return true;
  const asked = current.canAskAgain ? await requestRecordingPermissionsAsync() : current;
  if (asked.granted) return true;
  Alert.alert(
    'Allow the microphone',
    asked.canAskAgain
      ? 'DSM Clinic needs the microphone to record a voice message. Tap the mic again and choose Allow.'
      : 'The microphone is turned off for DSM Clinic. Open Settings, tap Permissions and allow the Microphone.',
    asked.canAskAgain
      ? [{ text: 'OK' }]
      : [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open settings', onPress: () => void Linking.openSettings() },
        ],
  );
  return false;
}

export function useVoiceRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const { durationMillis } = useAudioRecorderState(recorder, 250);
  const [recording, setRecording] = useState(false);

  const start = async () => {
    if (!(await microphoneAllowed().catch(() => false))) return;
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
    } catch {
      Alert.alert('Could not record', 'The microphone is busy. Close other apps using it and try again.');
    }
  };

  const stop = async () => {
    const length = recorder.getStatus().durationMillis;
    await recorder.stop().catch(() => undefined);
    await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
    setRecording(false);
    return length;
  };

  const finish = async (): Promise<{ file: UploadableFile; durationMs: number } | null> => {
    const length = await stop();
    const uri = recorder.uri;
    if (!uri || length < MIN_VOICE_MS) return null;
    return {
      file: { uri, name: `voice-${Date.now()}.m4a`, mimeType: VOICE_TYPE, size: null },
      durationMs: length,
    };
  };

  const cancel = async () => {
    await stop();
  };

  return { recording, seconds: Math.floor(durationMillis / 1000), start, finish, cancel };
}
