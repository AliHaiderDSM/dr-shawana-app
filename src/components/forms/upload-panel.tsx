import { FileText, ImageIcon, RotateCcw, ScanLine, Upload, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { Notice } from '@/components/ui/bits';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { errorMessage } from '@/lib/errors';
import { formatSize } from '@/lib/format';
import { colors, icon, radius, space, touch } from '@/theme/tokens';
import { type DocumentType, useUploadDocumentMutation } from '@/redux/features/documents';
import type { UploadableFile } from '@/types/api';
import { MAX_UPLOAD_BYTES, pickDocumentFile, pickImageFile, validateFile } from '@/utils/files';

export function UploadPanel() {
  const [file, setFile] = useState<UploadableFile | null>(null);
  const [type, setType] = useState<DocumentType>('medical_record');
  const [title, setTitle] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [upload, { isLoading: busy, error, reset }] = useUploadDocumentMutation();
  const handle = useRef<{ abort: () => void } | null>(null);

  const choose = (picked: UploadableFile) => {
    const invalid = validateFile(picked);
    setProblem(invalid);
    setFile(invalid ? null : picked);
    reset();
  };

  const pick = (kind: DocumentType) =>
    Alert.alert(
      kind === 'imaging' ? 'Add imaging' : 'Add a PDF or file',
      kind === 'imaging'
        ? 'Scans such as ultrasound, mammogram or DEXA. They are kept in your medical records.'
        : 'Lab or blood test reports. Your doctor uses them for your results.',
      [
        {
          text: 'Files',
          onPress: () =>
            void pickDocumentFile().then((picked) => {
              if (!picked) return;
              setType(kind);
              choose(picked);
            }),
        },
        {
          text: 'Photos',
          onPress: () =>
            void pickImageFile(false).then((picked) => {
              if (!picked) return;
              setType(kind);
              choose(picked);
            }),
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true },
    );

  const start = async () => {
    if (!file || busy) return;
    const request = upload({ file, title: title.trim(), type });
    handle.current = request;
    try {
      await request.unwrap();
      setFile(null);
      setTitle('');
      Alert.alert('Report uploaded', 'The clinic can now see it in your medical records.');
    } catch {
      return;
    } finally {
      handle.current = null;
    }
  };

  const cancelled = (error as { name?: string } | undefined)?.name === 'AbortError';
  const failed = error && !cancelled ? errorMessage(error) : null;

  return (
    <Card>
      <AppText variant="subheading">Add a report</AppText>
      <AppText variant="label" tone="muted">
        PDF or photo, up to {formatSize(MAX_UPLOAD_BYTES)}. Your doctor sees it with your records.
      </AppText>

      {!file ? (
        <View style={styles.pickers}>
          <PickButton label="PDF or file" icon={FileText} onPress={() => pick('medical_record')} />
          <PickButton label="Imaging" icon={ScanLine} onPress={() => pick('imaging')} />
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
            <AppText variant="caption" tone="muted">
              {type === 'imaging' ? 'Imaging' : 'PDF or file'}
              {file.size ? ` · ${formatSize(file.size)}` : ''}
            </AppText>
          </View>
          {!busy ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove the chosen file"
              onPress={() => {
                setFile(null);
                reset();
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
              accessibilityState={{ busy: true }}
            >
              <View style={styles.uploading}>
                <ActivityIndicator color={colors.primary} />
                <AppText variant="caption" tone="muted">
                  Uploading… keep the app open.
                </AppText>
              </View>
              <Button label="Cancel" variant="ghost" onPress={() => handle.current?.abort()} />
            </View>
          ) : failed ? (
            <>
              <Notice tone="warning">{failed}</Notice>
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
  uploading: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
