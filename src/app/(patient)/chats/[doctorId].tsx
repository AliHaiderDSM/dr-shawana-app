import { router, Stack, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { FileImage, FileText, ImagePlus, Mic, Send, Trash2, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SwipeToReply } from '@/components/chat/swipe-to-reply';
import { VoiceNote } from '@/components/chat/voice-note';
import { ErrorState, SkeletonBlock } from '@/components/feedback/states';
import { useKeyboardInset } from '@/hooks/use-keyboard-inset';
import { MAX_VOICE_SECONDS, useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { AppText } from '@/components/ui/app-text';
import { errorMessage } from '@/lib/errors';
import { formatDate, formatDuration, formatTime } from '@/lib/format';
import { useAppDispatch } from '@/redux/hooks';
import { colors, fontSize, icon, maxFontScale, radius, space, touch } from '@/theme/tokens';
import {
  markChatsSeen,
  type ChatMessage,
  useGetChatDoctorsQuery,
  useGetChatMessagesQuery,
  useLazyGetChatFileUrlQuery,
  useLazyGetChatMessagesQuery,
  useSendChatMessageMutation,
} from '@/redux/features/chat';
import type { UploadableFile } from '@/types/api';
import { pickImageFile, validateImage } from '@/utils/files';

const clock = (iso: string) => {
  const d = new Date(iso);
  return formatTime(`${d.getHours()}:${d.getMinutes()}`);
};

const dayOf = (iso: string) => formatDate(iso);

const quoteText = (m: { body: string | null; file: { name: string; type: string } | null }) =>
  m.body?.trim() || (m.file?.type.startsWith('audio/') ? 'Voice message' : (m.file?.name ?? 'Message'));

function Quote({
  message,
  mine,
}: {
  message: { sender: 'patient' | 'doctor'; body: string | null; file: { name: string; type: string } | null };
  mine: boolean;
}) {
  return (
    <View style={[styles.quote, mine ? styles.quoteMine : styles.quoteTheirs]}>
      <AppText
        variant="caption"
        weight="semibold"
        style={{ color: mine ? colors.textInverse : colors.primary }}
      >
        {message.sender === 'patient' ? 'You' : 'Doctor'}
      </AppText>
      <AppText
        variant="caption"
        numberOfLines={2}
        style={{ color: mine ? colors.textInverseMuted : colors.textMuted }}
      >
        {quoteText(message)}
      </AppText>
    </View>
  );
}

function ChatSkeleton() {
  return (
    <View style={styles.skeleton} accessibilityLabel="Loading messages" accessibilityRole="progressbar">
      {[62, 48, 70, 40, 56].map((width, index) => (
        <View key={index} style={[styles.bubbleRow, index % 2 ? styles.right : styles.left]}>
          <View style={[styles.skeletonBubble, { width: `${width}%` }]}>
            <SkeletonBlock height={14} />
            <SkeletonBlock width="60%" height={14} />
          </View>
        </View>
      ))}
    </View>
  );
}

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
  loadUrl,
  onReply,
}: {
  message: ChatMessage;
  showDay: boolean;
  opening: boolean;
  onOpen: (m: ChatMessage) => void;
  loadUrl: (m: ChatMessage) => Promise<string>;
  onReply: (m: ChatMessage) => void;
}) {
  const mine = message.sender === 'patient';
  const voice = message.file?.type.startsWith('audio/') ?? false;
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
      <SwipeToReply onReply={() => onReply(message)}>
        <View style={[styles.bubbleRow, mine ? styles.right : styles.left]}>
          <View
            style={[styles.bubble, mine ? styles.mine : styles.theirs]}
            accessible
            accessibilityLabel={`${mine ? 'You' : 'Doctor'}: ${message.body ?? (voice ? 'Voice message' : (message.file?.name ?? ''))}, ${clock(message.createdAt)}`}
          >
            {message.replyTo ? <Quote message={message.replyTo} mine={mine} /> : null}
            {voice ? (
              <VoiceNote mine={mine} load={() => loadUrl(message)} durationMs={message.file?.durationMs} />
            ) : message.file ? (
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
      </SwipeToReply>
    </View>
  );
}

export default function ChatScreen() {
  const { doctorId = '', name } = useLocalSearchParams<{ doctorId: string; name?: string }>();
  const dispatch = useAppDispatch();
  const doctor = useGetChatDoctorsQuery(undefined, {
    selectFromResult: ({ data }) => ({ data: data?.find((d) => d.doctorId === doctorId) }),
  }).data;
  const title = doctor?.name || name || 'Your doctor';
  const initial =
    title
      .replace(/^dr\.?\s*/i, '')
      .charAt(0)
      .toUpperCase() || 'D';
  const latest = useGetChatMessagesQuery({ doctorId }, { skip: !doctorId, refetchOnMountOrArgChange: true });
  const [loadOlder, olderState] = useLazyGetChatMessagesQuery();
  const [sendMessage, sendState] = useSendChatMessageMutation();
  const [getFileUrl] = useLazyGetChatFileUrlQuery();
  const [older, setOlder] = useState<ChatMessage[]>([]);
  const [moreOlder, setMoreOlder] = useState<boolean | null>(null);
  const [text, setText] = useState('');
  const [file, setFile] = useState<UploadableFile | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const input = useRef<TextInput>(null);
  const { frame, inset } = useKeyboardInset();
  const voice = useVoiceRecorder();
  const finishing = useRef(false);

  const seenAt = latest.data ? (latest.data.items.at(-1)?.id ?? 'empty') : null;
  useEffect(() => {
    if (seenAt) {
      dispatch(markChatsSeen());
    }
  }, [seenAt, dispatch]);

  const messages = merge(older, latest.data?.items ?? []);
  const newestFirst = [...messages].reverse();
  const hasMore = moreOlder ?? latest.data?.hasMore ?? false;
  const sending = sendState.isLoading;
  const canSend = Boolean(text.trim() || file);

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
    Alert.alert(
      'Send a photo',
      'A photo of a report, up to 10 MB.',
      [
        { text: 'Gallery', onPress: () => void pickImageFile(false).then(choose) },
        { text: 'Camera', onPress: () => void pickImageFile(true).then(choose) },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true },
    );

  function choose(picked: UploadableFile | null) {
    if (!picked) return;
    const problem = validateImage(picked);
    if (problem) Alert.alert('Cannot send this file', problem);
    else setFile(picked);
  }

  const send = async () => {
    const body = text.trim();
    if (sending || (!body && !file)) return;
    try {
      await sendMessage({ doctorId, body, file, replyToId: replyTo?.id ?? null }).unwrap();
      setText('');
      setFile(null);
      setReplyTo(null);
    } catch (error) {
      Alert.alert('Message not sent', errorMessage(error));
    }
  };

  const sendVoice = async () => {
    if (finishing.current) return;
    finishing.current = true;
    const recorded = await voice.finish().finally(() => {
      finishing.current = false;
    });
    if (!recorded) {
      Alert.alert('Too short', 'Hold on a little longer and speak, then press send.');
      return;
    }
    try {
      await sendMessage({
        doctorId,
        body: '',
        file: recorded.file,
        durationMs: recorded.durationMs,
        replyToId: replyTo?.id ?? null,
      })
        .unwrap()
        .then(() => setReplyTo(null));
    } catch (error) {
      Alert.alert('Voice message not sent', errorMessage(error));
    }
  };

  const reachedLimit = voice.recording && voice.seconds >= MAX_VOICE_SECONDS;
  useEffect(() => {
    if (reachedLimit) void sendVoice();
  });

  const loadUrl = async (message: ChatMessage) =>
    (await getFileUrl({ doctorId, messageId: message.id }).unwrap()).url;

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
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.textInverse,
          headerShadowVisible: false,
          headerTitle: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${title}, open doctor details and shared files`}
              onPress={() =>
                router.push({ pathname: '/chats/info/[doctorId]', params: { doctorId, name: title } })
              }
              hitSlop={8}
              style={styles.header}
            >
              <View style={styles.avatar}>
                <AppText weight="bold" style={styles.avatarText}>
                  {initial}
                </AppText>
              </View>
              <View style={styles.flex}>
                <AppText weight="semibold" numberOfLines={1} style={styles.headerName}>
                  {title}
                </AppText>
                <AppText variant="caption" numberOfLines={1} style={styles.headerSub}>
                  {doctor?.details ? `${doctor.details} · ` : ''}Tap for details
                </AppText>
              </View>
            </Pressable>
          ),
        }}
      />
      <View ref={frame} style={[styles.root, { paddingBottom: inset }]}>
        {latest.isError && !latest.data ? (
          <ErrorState error={latest.error} onRetry={latest.refetch} retrying={latest.isFetching} />
        ) : latest.isLoading ? (
          <ChatSkeleton />
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
                  loadUrl={loadUrl}
                  onReply={(m) => {
                    setReplyTo(m);
                    input.current?.focus();
                  }}
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
          {replyTo ? (
            <View style={styles.replying}>
              <View style={styles.flex}>
                <Quote message={replyTo} mine={false} />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel the reply"
                hitSlop={8}
                onPress={() => setReplyTo(null)}
              >
                <X size={icon.md} color={colors.textMuted} />
              </Pressable>
            </View>
          ) : null}
          {file ? (
            <View style={styles.pending}>
              <ImagePlus size={icon.sm} color={colors.textMuted} />
              <AppText variant="label" numberOfLines={1} style={styles.flex}>
                {file.name}
              </AppText>
              {sending ? (
                <ActivityIndicator color={colors.primary} />
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
          {voice.recording ? (
            <View style={styles.inputRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete the recording"
                onPress={() => void voice.cancel()}
                style={styles.iconButton}
              >
                <Trash2 size={icon.lg} color={colors.danger} />
              </Pressable>
              <View style={styles.recordingBar} accessibilityLiveRegion="polite">
                <View style={styles.recDot} />
                <AppText weight="semibold" style={styles.flex}>
                  Recording {formatDuration(voice.seconds)}
                </AppText>
                <AppText variant="caption" tone="muted">
                  max {formatDuration(MAX_VOICE_SECONDS)}
                </AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send voice message"
                onPress={() => void sendVoice()}
                style={styles.send}
              >
                <Send size={icon.md} color={colors.textInverse} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.inputRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Attach a photo"
                onPress={attach}
                disabled={sending}
                style={styles.iconButton}
              >
                <ImagePlus size={icon.lg} color={colors.textMuted} />
              </Pressable>
              <TextInput
                ref={input}
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
              {canSend || sending ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Send"
                  accessibilityState={{ disabled: sending, busy: sending }}
                  onPress={() => void send()}
                  disabled={sending}
                  style={[styles.send, sending && styles.sendOff]}
                >
                  {sending ? (
                    <ActivityIndicator color={colors.textInverse} />
                  ) : (
                    <Send size={icon.md} color={colors.textInverse} />
                  )}
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Record a voice message"
                  onPress={() => void voice.start()}
                  style={styles.send}
                >
                  <Mic size={icon.md} color={colors.textInverse} />
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1, minWidth: 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, maxWidth: 260 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.onPrimarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.textInverse },
  headerName: { color: colors.textInverse },
  headerSub: { color: colors.textInverseMuted },
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
  recordingBar: {
    flex: 1,
    minHeight: touch.iconButton,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSoft,
  },
  recDot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.danger },
  quote: {
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderLeftWidth: 3,
    borderRadius: radius.sm,
    gap: space.xxs,
  },
  quoteMine: { backgroundColor: colors.onPrimarySoft, borderLeftColor: colors.textInverse },
  quoteTheirs: { backgroundColor: colors.surfaceMuted, borderLeftColor: colors.primary },
  replying: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  skeleton: { flex: 1, justifyContent: 'flex-end', gap: space.md, padding: space.md },
  skeletonBubble: {
    gap: space.xs,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
});
