import { Stack, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { FileImage, FileText, Paperclip, Send, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { signOut } from '@/features/auth/auth-actions';
import { tokenRefreshed } from '@/features/auth/auth-slice';
import { validateFile, type PickedFile } from '@/features/documents/file-rules';
import { pickDocumentFile, pickImageFile } from '@/features/documents/pickers';
import { uploadFile } from '@/features/documents/upload';
import { errorMessage } from '@/lib/errors';
import { formatDate, formatTime } from '@/lib/format';
import {
  useChatFileUrlMutation,
  useChatMessagesQuery,
  useLazyChatMessagesQuery,
  useSendChatMessageMutation,
} from '@/services/api/patient-api';
import { api } from '@/services/api/base-api';
import { useAppDispatch, useAppSelector } from '@/store';
import { colors, fontSize, icon, maxFontScale, radius, space, touch } from '@/theme/tokens';
import type { ChatMessage } from '@/types/api';

const clock = (iso: string) => {
  const d = new Date(iso);
  return formatTime(`${d.getHours()}:${d.getMinutes()}`);
};

const dayOf = (iso: string) => formatDate(iso);

function merge(...lists: ChatMessage[][]) {
  const byId = new Map<string, ChatMessage>();
  for (const list of lists) for (const m of list) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function Bubble({
  message,
  showDay,
  opening,
  onOpen,
}: {
  message: ChatMessage;
  showDay: boolean;
  opening: boolean;
  onOpen: (m: ChatMessage) => void;
}) {
  const mine = message.sender === 'patient';
  const FileIcon = message.file?.type.startsWith('image/') ? FileImage : FileText;
  const fg = mine ? colors.textInverse : colors.text;
  return (
    <View style={styles.cell}>
      {showDay ? (
        <View style={styles.day}>
          <AppText variant="caption" tone="muted">
            {dayOf(message.createdAt)}
          </AppText>
        </View>
      ) : null}
      <View style={[styles.bubbleRow, mine ? styles.right : styles.left]}>
        <View
          style={[styles.bubble, mine ? styles.mine : styles.theirs]}
          accessible
          accessibilityLabel={`${mine ? 'You' : 'Doctor'}: ${message.body ?? message.file?.name ?? ''}, ${clock(message.createdAt)}`}
        >
          {message.file ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${message.file.name}`}
              onPress={() => onOpen(message)}
              style={[styles.file, { backgroundColor: mine ? colors.onPrimarySoft : colors.surfaceMuted }]}
            >
              {opening ? <ActivityIndicator color={fg} /> : <FileIcon size={icon.md} color={fg} />}
              <AppText variant="label" numberOfLines={2} style={[styles.flex, { color: fg }]}>
                {message.file.name}
              </AppText>
            </Pressable>
          ) : null}
          {message.body ? (
            <AppText selectable style={{ color: fg }}>
              {message.body}
            </AppText>
          ) : null}
          <AppText
            variant="caption"
            style={[styles.time, { color: mine ? colors.textInverseMuted : colors.textMuted }]}
          >
            {clock(message.createdAt)}
          </AppText>
        </View>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { doctorId = '', name } = useLocalSearchParams<{ doctorId: string; name?: string }>();
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const latest = useChatMessagesQuery(
    { doctorId },
    {
      skip: !doctorId,
      pollingInterval: 5_000,
      skipPollingIfUnfocused: true,
      refetchOnMountOrArgChange: true,
    },
  );
  const [loadOlder, olderState] = useLazyChatMessagesQuery();
  const [sendText, sendState] = useSendChatMessageMutation();
  const [getFileUrl] = useChatFileUrlMutation();
  const [older, setOlder] = useState<ChatMessage[]>([]);
  const [moreOlder, setMoreOlder] = useState<boolean | null>(null);
  const [text, setText] = useState('');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [frameTop, setFrameTop] = useState(0);
  const frame = useRef<View>(null);

  const seenAt = latest.data ? (latest.data.items.at(-1)?.id ?? 'empty') : null;
  useEffect(() => {
    if (seenAt) {
      dispatch(
        api.util.invalidateTags([
          { type: 'Chats', id: 'LIST' },
          { type: 'Chats', id: 'UNREAD' },
        ]),
      );
    }
  }, [seenAt, dispatch]);

  const messages = merge(older, latest.data?.items ?? []);
  const newestFirst = [...messages].reverse();
  const hasMore = moreOlder ?? latest.data?.hasMore ?? false;
  const sending = sendState.isLoading || progress !== null;

  const fetchOlder = async () => {
    const first = messages[0];
    if (!hasMore || !first || olderState.isFetching) return;
    const page = await loadOlder({ doctorId, before: first.createdAt })
      .unwrap()
      .catch(() => null);
    if (!page) return;
    setOlder((current) => merge(page.items, current));
    setMoreOlder(page.hasMore);
  };

  const attach = () =>
    Alert.alert('Send a file', 'A photo of a report or a PDF, up to 10 MB.', [
      { text: 'Photo', onPress: () => void pickImageFile(false).then(choose) },
      { text: 'Camera', onPress: () => void pickImageFile(true).then(choose) },
      { text: 'PDF or file', onPress: () => void pickDocumentFile().then(choose) },
      { text: 'Cancel', style: 'cancel' },
    ]);

  function choose(picked: PickedFile | null) {
    if (!picked) return;
    const problem = validateFile(picked);
    if (problem) Alert.alert('Cannot send this file', problem);
    else setFile(picked);
  }

  const send = async () => {
    const body = text.trim();
    if (sending || (!body && !file)) return;
    try {
      if (file) {
        setProgress(0);
        await uploadFile({
          file,
          accessToken,
          path: `/patient/chats/${encodeURIComponent(doctorId)}/messages`,
          fieldName: 'file',
          parameters: body ? { body } : {},
          onToken: (token) => dispatch(tokenRefreshed({ accessToken: token })),
          onProgress: setProgress,
        }).promise;
      } else {
        await sendText({ doctorId, body }).unwrap();
      }
      setText('');
      setFile(null);
      void latest.refetch();
    } catch (error) {
      const err = error as { sessionEnded?: boolean; message?: string };
      if (err.sessionEnded) {
        void dispatch(signOut(err.message));
        return;
      }
      Alert.alert('Message not sent', err.message ?? errorMessage(error));
    } finally {
      setProgress(null);
    }
  };

  const open = async (message: ChatMessage) => {
    if (openingId) return;
    setOpeningId(message.id);
    try {
      const { url } = await getFileUrl({ doctorId, messageId: message.id }).unwrap();
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: colors.surface,
        controlsColor: colors.primary,
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      });
    } catch (error) {
      Alert.alert('Could not open the file', errorMessage(error));
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: name || 'Your doctor' }} />
      <View
        ref={frame}
        style={styles.root}
        onLayout={() => frame.current?.measureInWindow((_x, y) => setFrameTop(y))}
      >
        <KeyboardAvoidingView style={styles.root} behavior="padding" keyboardVerticalOffset={frameTop}>
          {latest.isError && !latest.data ? (
            <ErrorState error={latest.error} onRetry={latest.refetch} retrying={latest.isFetching} />
          ) : (
            <FlatList
              inverted
              data={newestFirst}
              keyExtractor={(m) => m.id}
              contentContainerStyle={styles.list}
              renderItem={({ item, index }) => {
                const olderItem = newestFirst[index + 1];
                return (
                  <Bubble
                    message={item}
                    showDay={!olderItem || dayOf(olderItem.createdAt) !== dayOf(item.createdAt)}
                    opening={openingId === item.id}
                    onOpen={(m) => void open(m)}
                  />
                );
              }}
              onEndReached={() => void fetchOlder()}
              onEndReachedThreshold={0.2}
              ListFooterComponent={
                latest.isLoading || olderState.isFetching ? (
                  <ActivityIndicator color={colors.primary} style={styles.loader} />
                ) : !hasMore ? (
                  <AppText variant="caption" tone="muted" center style={styles.hint}>
                    Messages go to your doctor only. Not for emergencies.
                  </AppText>
                ) : null
              }
              ListEmptyComponent={
                latest.isLoading ? null : (
                  <AppText tone="muted" center style={styles.hint}>
                    Write your first message. Your doctor replies here.
                  </AppText>
                )
              }
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            />
          )}

          <View style={styles.composer}>
            {file ? (
              <View style={styles.pending}>
                <Paperclip size={icon.sm} color={colors.textMuted} />
                <AppText variant="label" numberOfLines={1} style={styles.flex}>
                  {file.name}
                </AppText>
                {progress !== null ? (
                  <AppText variant="caption" tone="muted">
                    {Math.round(progress * 100)}%
                  </AppText>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remove the file"
                    hitSlop={8}
                    onPress={() => setFile(null)}
                  >
                    <X size={icon.md} color={colors.textMuted} />
                  </Pressable>
                )}
              </View>
            ) : null}
            <View style={styles.inputRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Attach a photo or PDF"
                onPress={attach}
                disabled={sending}
                style={styles.iconButton}
              >
                <Paperclip size={icon.lg} color={colors.textMuted} />
              </Pressable>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Write a message"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={4000}
                maxFontSizeMultiplier={maxFontScale}
                accessibilityLabel="Message"
                style={styles.input}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send"
                accessibilityState={{ disabled: sending || (!text.trim() && !file), busy: sending }}
                onPress={() => void send()}
                disabled={sending || (!text.trim() && !file)}
                style={[styles.send, (sending || (!text.trim() && !file)) && styles.sendOff]}
              >
                {sending ? (
                  <ActivityIndicator color={colors.textInverse} />
                ) : (
                  <Send size={icon.md} color={colors.textInverse} />
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1, minWidth: 0 },
  list: { paddingHorizontal: space.md, paddingVertical: space.md, flexGrow: 1 },
  cell: { gap: space.sm, marginBottom: space.sm },
  day: {
    alignSelf: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  bubbleRow: { flexDirection: 'row' },
  right: { justifyContent: 'flex-end' },
  left: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    gap: space.xs,
    borderRadius: radius.lg,
  },
  mine: { backgroundColor: colors.primary, borderBottomRightRadius: radius.sm / 2 },
  theirs: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.sm / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  file: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.sm,
    borderRadius: radius.md,
    minHeight: touch.iconButton,
  },
  time: { alignSelf: 'flex-end' },
  loader: { marginVertical: space.lg },
  hint: { marginVertical: space.lg, paddingHorizontal: space.lg },
  composer: {
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  pending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  iconButton: {
    width: touch.iconButton,
    height: touch.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: touch.iconButton,
    maxHeight: 140,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    fontSize: fontSize.md,
    color: colors.text,
  },
  send: {
    width: touch.iconButton,
    height: touch.iconButton,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOff: { opacity: 0.5 },
});
