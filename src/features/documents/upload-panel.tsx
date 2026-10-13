import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Camera, FileText, ImageIcon, RotateCcw, Upload, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { Notice } from '@/components/ui/bits';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { signOut } from '@/features/auth/auth-actions';
import { tokenRefreshed } from '@/features/auth/auth-slice';
import { formatSize } from '@/lib/format';
import { api } from '@/services/api/base-api';
import { useAppDispatch, useAppSelector } from '@/store';
import { colors, icon, radius, space, touch } from '@/theme/tokens';
import { MAX_UPLOAD_BYTES, normalizeType, UPLOAD_TYPES, validateFile, type PickedFile } from './file-rules';
import { uploadDocument, type UploadHandle } from './upload';

type Phase = { kind: 'idle' } | { kind: 'uploading'; progress: number } | { kind: 'failed'; message: string };

export function UploadPanel() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const [file, setFile] = useState<PickedFile | null>(null);
  const [title, setTitle] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const handle = useRef<UploadHandle | null>(null);
  const busy = phase.kind === 'uploading';

  const choose = (picked: PickedFile) => {
    const invalid = validateFile(picked);
    setProblem(invalid);
    setFile(invalid ? null : picked);
    setPhase({ kind: 'idle' });
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [...UPLOAD_TYPES],
      multiple: false,
      copyToCacheDirectory: true,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;
    choose({
      uri: asset.uri,
      name: asset.name,
      mimeType: normalizeType(asset.name, asset.mimeType),
      size: asset.size ?? null,
    });
  };

  const pickImage = async (camera: boolean) => {
    if (camera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera not allowed',
          'Allow camera access in your phone settings to take a photo of a report.',
        );
        return;
      }
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8, exif: false };
    const result = camera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;
    const name = asset.fileName ?? `report-${Date.now()}.jpg`;
    choose({
      uri: asset.uri,
      name,
      mimeType: normalizeType(name, asset.mimeType ?? 'image/jpeg'),
      size: asset.fileSize ?? null,
    });
  };

  const start = async () => {
    if (!file || busy) return;
    setPhase({ kind: 'uploading', progress: 0 });
    const upload = uploadDocument({
      file,
      title: title.trim(),
      accessToken,
      onToken: (token) => dispatch(tokenRefreshed({ accessToken: token })),
      onProgress: (progress) => setPhase({ kind: 'uploading', progress }),
    });
    handle.current = upload;
    try {
      await upload.promise;
      setFile(null);
      setTitle('');
      setPhase({ kind: 'idle' });
      dispatch(api.util.invalidateTags(['Documents', 'Overview', 'History']));
      Alert.alert('Report uploaded', 'The clinic can now see it in your medical records.');
    } catch (error) {
      const err = error as { message?: string; sessionEnded?: boolean };
      if (err.sessionEnded) {
        void dispatch(signOut(err.message));
        return;
      }
      setPhase({ kind: 'failed', message: err.message ?? 'The upload failed. Please try again.' });
    } finally {
      handle.current = null;
    }
  };

  const progress = phase.kind === 'uploading' ? phase.progress : 0;

  return (
    <Card>
      <AppText variant="subheading">Add a report</AppText>
      <AppText variant="label" tone="muted">
        PDF or photo, up to {formatSize(MAX_UPLOAD_BYTES)}. Your doctor sees it with your records.
      </AppText>

      {!file ? (
        <View style={styles.pickers}>
          <PickButton label="PDF or file" icon={FileText} onPress={() => void pickDocument()} />
          <PickButton label="Photo" icon={ImageIcon} onPress={() => void pickImage(false)} />
          <PickButton label="Camera" icon={Camera} onPress={() => void pickImage(true)} />
        </View>
      ) : (
        <View style={styles.picked}>
          {file.mimeType === 'application/pdf' ? (
            <FileText size={icon.md} color={colors.primary} />
          ) : (
            <ImageIcon size={icon.md} color={colors.primary} />
          )}
          <View style={styles.flex}>
            <AppText variant="label" numberOfLines={2}>
              {file.name}
            </AppText>
            {file.size ? (
              <AppText variant="caption" tone="muted">
                {formatSize(file.size)}
              </AppText>
            ) : null}
          </View>
          {!busy ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove the chosen file"
              onPress={() => {
                setFile(null);
                setPhase({ kind: 'idle' });
              }}
              hitSlop={8}
              style={styles.remove}
            >
              <X size={icon.md} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      )}

      {problem ? <Notice tone="warning">{problem}</Notice> : null}

      {file ? (
        <>
          <TextField
            label="Title (optional)"
            placeholder="e.g. Blood test, March"
            value={title}
            onChangeText={setTitle}
            maxLength={200}
            editable={!busy}
          />
          {busy ? (
            <View
              style={styles.progressWrap}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
            >
              <View style={styles.track}>
                <View style={[styles.bar, { width: `${Math.max(4, Math.round(progress * 100))}%` }]} />
              </View>
              <AppText variant="caption" tone="muted">
                Uploading… {Math.round(progress * 100)}%
              </AppText>
              <Button label="Cancel" variant="ghost" onPress={() => handle.current?.cancel()} />
            </View>
          ) : phase.kind === 'failed' ? (
            <>
              <Notice tone="warning">{phase.message}</Notice>
              <Button label="Try again" icon={RotateCcw} onPress={() => void start()} />
            </>
          ) : (
            <Button label="Upload report" icon={Upload} onPress={() => void start()} />
          )}
        </>
      ) : null}
    </Card>
  );
}

function PickButton({
  label,
  icon: Icon,
  onPress,
}: {
  label: string;
  icon: typeof FileText;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Choose ${label.toLowerCase()}`}
      onPress={onPress}
      style={({ pressed }) => [styles.pick, pressed && styles.pickPressed]}
    >
      <Icon size={icon.lg} color={colors.primary} />
      <AppText variant="caption" weight="semibold" center numberOfLines={2}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pickers: { flexDirection: 'row', gap: space.sm },
  pick: {
    flex: 1,
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    padding: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  pickPressed: { opacity: 0.8 },
  picked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  remove: {
    width: touch.iconButton,
    height: touch.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrap: { gap: space.sm },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  bar: { height: 8, borderRadius: radius.pill, backgroundColor: colors.primary },
});
