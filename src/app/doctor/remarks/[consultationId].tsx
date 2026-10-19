import { router, useLocalSearchParams } from 'expo-router';
import { Bold, Eye, Italic, List, ListOrdered, PenLine, Save } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { CardSkeleton, ErrorState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { RichTextView } from '@/components/ui/rich-text-view';
import { Screen } from '@/components/ui/screen';
import { errorMessage } from '@/lib/errors';
import { formatDay } from '@/lib/format';
import { htmlToMarkup, markupToHtml } from '@/lib/rich-text';
import { colors, fontSize, icon, maxFontScale, radius, space, touch } from '@/theme/tokens';
import {
  type PatientFileRemark,
  useGetDoctorPatientFileQuery,
  useSaveDoctorRemarksMutation,
} from '@/redux/features/doctor';

type Selection = { start: number; end: number };

function wrap(text: string, selection: Selection, mark: string) {
  const { start, end } = selection;
  const picked = text.slice(start, end) || 'text';
  const next = `${text.slice(0, start)}${mark}${picked}${mark}${text.slice(end)}`;
  const from = start + mark.length;
  return { text: next, selection: { start: from, end: from + picked.length } };
}

function prefixLines(text: string, selection: Selection, ordered: boolean) {
  const lineStart = text.lastIndexOf('\n', Math.max(0, selection.start - 1)) + 1;
  const nextBreak = text.indexOf('\n', selection.end);
  const lineEnd = nextBreak === -1 ? text.length : nextBreak;
  const lines = text.slice(lineStart, lineEnd).split('\n');
  const marked = lines.map((line, index) => {
    const bare = line.replace(/^\s*([-*•]|\d+[.)])\s+/, '');
    return ordered ? `${index + 1}. ${bare}` : `- ${bare}`;
  });
  const block = marked.join('\n');
  return {
    text: `${text.slice(0, lineStart)}${block}${text.slice(lineEnd)}`,
    selection: { start: lineStart + block.length, end: lineStart + block.length },
  };
}

function Tool({ label, icon: Icon, onPress }: { label: string; icon: typeof Bold; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.tool, pressed && styles.toolPressed]}
    >
      <Icon size={icon.md} color={colors.text} />
    </Pressable>
  );
}

function Editor({ remark, patientId }: { remark: PatientFileRemark; patientId: string }) {
  const initial = htmlToMarkup(remark.remarks);
  const [text, setText] = useState(initial);
  const [selection, setSelection] = useState<Selection>({ start: initial.length, end: initial.length });
  const [preview, setPreview] = useState(false);
  const [save, { isLoading }] = useSaveDoctorRemarksMutation();
  const changed = text.trim() !== initial.trim();

  const apply = (next: { text: string; selection: Selection }) => {
    setText(next.text);
    setSelection(next.selection);
  };

  const submit = async () => {
    try {
      await save({ consultationId: remark.consultationId, patientId, remarks: markupToHtml(text) }).unwrap();
      router.back();
    } catch (error) {
      Alert.alert('Remarks not saved', errorMessage(error));
    }
  };

  return (
    <Screen
      keyboard
      footer={
        <Button
          label="Save remarks"
          icon={Save}
          loading={isLoading}
          disabled={!changed}
          onPress={() => void submit()}
        />
      }
    >
      <View style={styles.head}>
        <AppText weight="semibold">Visit #{remark.appointmentNo}</AppText>
        <AppText variant="caption" tone="muted">
          {formatDay(remark.date)} · shows in the patient history and on the dashboard
        </AppText>
      </View>

      <View style={styles.bar}>
        <View style={styles.tools}>
          <Tool label="Bold" icon={Bold} onPress={() => apply(wrap(text, selection, '**'))} />
          <Tool label="Italic" icon={Italic} onPress={() => apply(wrap(text, selection, '_'))} />
          <Tool label="Bullet list" icon={List} onPress={() => apply(prefixLines(text, selection, false))} />
          <Tool
            label="Numbered list"
            icon={ListOrdered}
            onPress={() => apply(prefixLines(text, selection, true))}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={preview ? 'Back to writing' : 'Preview'}
          onPress={() => setPreview((v) => !v)}
          style={styles.mode}
        >
          {preview ? (
            <PenLine size={icon.sm} color={colors.primary} />
          ) : (
            <Eye size={icon.sm} color={colors.primary} />
          )}
          <AppText variant="caption" weight="semibold" tone="primary">
            {preview ? 'Write' : 'Preview'}
          </AppText>
        </Pressable>
      </View>

      {preview ? (
        <View style={styles.preview}>
          {text.trim() ? (
            <RichTextView html={markupToHtml(text)} />
          ) : (
            <AppText tone="muted">Nothing written yet.</AppText>
          )}
        </View>
      ) : (
        <TextInput
          value={text}
          onChangeText={setText}
          selection={selection}
          onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
          multiline
          autoFocus
          maxLength={50000}
          placeholder="Write the clinical remarks for this visit"
          placeholderTextColor={colors.textMuted}
          maxFontSizeMultiplier={maxFontScale}
          accessibilityLabel="Clinical remarks"
          textAlignVertical="top"
          style={styles.input}
        />
      )}
      <AppText variant="caption" tone="muted">
        Select words and tap B or I. Lists start each line with a bullet or a number.
      </AppText>
    </Screen>
  );
}

export default function DoctorRemarksScreen() {
  const { consultationId = '', patientId = '' } = useLocalSearchParams<{
    consultationId: string;
    patientId: string;
  }>();
  const file = useGetDoctorPatientFileQuery(patientId, { skip: !patientId });
  const remark = file.data?.remarks.find((r) => r.consultationId === consultationId);

  if (file.isLoading)
    return (
      <Screen>
        <CardSkeleton count={2} />
      </Screen>
    );
  if (!remark || !remark.editable)
    return (
      <Screen>
        <ErrorState
          error={file.error ?? new Error('You can edit only your own consultations.')}
          onRetry={file.refetch}
          retrying={file.isFetching}
        />
      </Screen>
    );
  return <Editor key={remark.consultationId} remark={remark} patientId={patientId} />;
}

const styles = StyleSheet.create({
  head: { gap: space.xxs },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  tools: {
    flexDirection: 'row',
    gap: space.xs,
    padding: space.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tool: {
    width: touch.iconButton,
    height: touch.iconButton - 4,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolPressed: { backgroundColor: colors.surfaceMuted },
  mode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.md,
    minHeight: touch.iconButton - 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  input: {
    minHeight: 260,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontSize: fontSize.md,
    color: colors.text,
  },
  preview: {
    minHeight: 260,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
