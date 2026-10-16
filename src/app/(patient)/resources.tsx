import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { BookOpen, ChevronRight, Clock, FileImage, FileText, MessageSquarePlus } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { useRefresh } from '@/hooks/use-refresh';
import { errorMessage } from '@/lib/errors';
import { formatDate, formatSize } from '@/lib/format';
import {
  type ResourceFile,
  useGetOverviewQuery,
  useLazyGetResourceFileUrlQuery,
} from '@/redux/features/patient';
import { colors, icon, radius, space, touch } from '@/theme/tokens';

function FileRow({
  file,
  opening,
  onOpen,
}: {
  file: ResourceFile;
  opening: boolean;
  onOpen: (file: ResourceFile) => void;
}) {
  const Icon = file.type.startsWith('image/') ? FileImage : FileText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${file.name}`}
      onPress={() => onOpen(file)}
      style={({ pressed }) => [styles.file, pressed && styles.pressed]}
    >
      <View style={styles.fileIcon}>
        {opening ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Icon size={icon.md} color={colors.primary} />
        )}
      </View>
      <View style={styles.flex}>
        <AppText variant="label" weight="semibold" numberOfLines={2}>
          {file.name}
        </AppText>
        <AppText variant="caption" tone="muted">
          {file.type === 'application/pdf' ? 'PDF' : 'Photo'} · {formatSize(file.size)}
        </AppText>
      </View>
      <ChevronRight size={icon.md} color={colors.textMuted} />
    </Pressable>
  );
}

export default function ResourcesScreen() {
  const overview = useGetOverviewQuery(undefined, { refetchOnMountOrArgChange: true });
  const [getUrl] = useLazyGetResourceFileUrlQuery();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const { refreshing, onRefresh } = useRefresh(overview.refetch);
  const resources = overview.data?.resources ?? null;

  const open = async (file: ResourceFile) => {
    if (openingId) return;
    setOpeningId(file.id);
    try {
      const { url } = await getUrl(file.id).unwrap();
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

  if (overview.isLoading) {
    return (
      <Screen>
        <CardSkeleton count={3} />
      </Screen>
    );
  }

  if (overview.isError) {
    return (
      <Screen>
        <ErrorState error={overview.error} onRetry={overview.refetch} retrying={overview.isFetching} />
      </Screen>
    );
  }

  if (!resources) {
    return (
      <Screen refreshing={refreshing} onRefresh={onRefresh}>
        <EmptyState
          icon={BookOpen}
          title="No resources yet"
          message="When your doctor recommends a diet plan, detox or care routine, it shows here."
        />
      </Screen>
    );
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <AppText tone="muted" variant="label">
        Recommended by {resources.doctor ?? 'your doctor'} on {formatDate(resources.date)}. Tap a file to read
        it.
      </AppText>
      {resources.items.map((item) => (
        <Card key={item.key}>
          <View style={styles.row}>
            <View style={styles.iconBox}>
              <BookOpen size={icon.md} color={colors.primary} />
            </View>
            <AppText weight="semibold" style={styles.flex}>
              {item.label}
            </AppText>
          </View>
          {item.files.length ? (
            <View style={styles.files}>
              {item.files.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  opening={openingId === file.id}
                  onOpen={(f) => void open(f)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.soon}>
              <Clock size={icon.sm} color={colors.textMuted} />
              <AppText variant="label" tone="muted" style={styles.flex}>
                Guide coming soon. Ask the clinic for it.
              </AppText>
            </View>
          )}
        </Card>
      ))}
      <Button
        label="Ask the clinic about these"
        icon={MessageSquarePlus}
        variant="secondary"
        onPress={() => router.push('/contact')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0, gap: space.xxs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  iconBox: {
    width: touch.iconButton,
    height: touch.iconButton,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  files: { gap: space.sm },
  file: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: touch.iconButton,
    padding: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  pressed: { opacity: 0.8 },
  fileIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
});
