import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ExternalLink, FileImage, FileText, FolderOpen } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/bits';
import { ListScreen } from '@/components/ui/list-screen';
import { useRefresh } from '@/hooks/use-refresh';
import { errorMessage } from '@/lib/errors';
import { formatDate, formatSize, initials } from '@/lib/format';
import { useChatFileUrlMutation, useChatFilesQuery } from '@/services/api/patient-api';
import { colors, icon, radius, space, touch } from '@/theme/tokens';
import type { ChatMessage } from '@/types/api';

export default function DoctorInfoScreen() {
  const { doctorId = '', name } = useLocalSearchParams<{ doctorId: string; name?: string }>();
  const files = useChatFilesQuery(doctorId, { skip: !doctorId, refetchOnMountOrArgChange: true });
  const { refreshing, onRefresh } = useRefresh(files.refetch);
  const [getUrl] = useChatFileUrlMutation();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const doctorName = name || 'Your doctor';

  const open = async (message: ChatMessage) => {
    if (openingId) return;
    setOpeningId(message.id);
    try {
      const { url } = await getUrl({ doctorId, messageId: message.id }).unwrap();
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
    <ListScreen
      data={files.data}
      keyExtractor={(m) => m.id}
      gap={space.sm}
      isLoading={files.isLoading}
      error={files.error}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onRetry={files.refetch}
      header={
        <>
          <View style={styles.head}>
            <Avatar text={initials(doctorName)} size={72} />
            <AppText variant="heading" center accessibilityRole="header">
              {doctorName}
            </AppText>
          </View>
          <AppText variant="subheading">Shared files{files.data ? ` (${files.data.length})` : ''}</AppText>
          <AppText variant="label" tone="muted">
            Only the files you and {doctorName} sent each other in this chat.
          </AppText>
        </>
      }
      renderItem={({ item }) => {
        const Icon = item.file?.type.startsWith('image/') ? FileImage : FileText;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.file?.name ?? 'file'}`}
            onPress={() => void open(item)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={styles.iconBox}>
              <Icon size={icon.lg} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <AppText variant="label" weight="semibold" numberOfLines={2}>
                {item.file?.name}
              </AppText>
              <AppText variant="caption" tone="muted">
                {item.sender === 'patient' ? 'You' : doctorName} · {formatDate(item.createdAt)}
                {item.file?.size ? ` · ${formatSize(item.file.size)}` : ''}
              </AppText>
            </View>
            {openingId === item.id ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <ExternalLink size={icon.md} color={colors.textMuted} />
            )}
          </Pressable>
        );
      }}
      empty={
        <EmptyState
          icon={FolderOpen}
          title="No files yet"
          message="Photos and reports sent in this chat will appear here."
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', gap: space.sm, paddingVertical: space.md },
  flex: { flex: 1, minWidth: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: touch.minHeight,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  iconBox: {
    width: touch.iconButton,
    height: touch.iconButton,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
