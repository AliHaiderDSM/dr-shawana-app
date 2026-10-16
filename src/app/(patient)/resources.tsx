import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { BookOpen, ChevronRight, FileImage, FileText, MessageSquarePlus } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { useRefresh } from '@/hooks/use-refresh';
import { SERVER_ORIGIN } from '@/lib/config';
import { formatDate } from '@/lib/format';
import { useGetOverviewQuery, type EducationalResources } from '@/redux/features/patient';
import { colors, icon, radius, shadow, space, touch } from '@/theme/tokens';

type Resource = EducationalResources['items'][number];

function ResourceRow({
  resource,
  opening,
  onOpen,
}: {
  resource: Resource;
  opening: boolean;
  onOpen: (resource: Resource) => void;
}) {
  const pdf = resource.file.type === 'application/pdf';
  const Icon = pdf ? FileText : FileImage;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${resource.label}`}
      accessibilityHint="Opens the guide. You can save or share it from there."
      onPress={() => onOpen(resource)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.iconBox}>
        {opening ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Icon size={icon.md} color={colors.primary} />
        )}
      </View>
      <View style={styles.flex}>
        <AppText weight="semibold">{resource.label}</AppText>
        <AppText variant="caption" tone="muted">
          {pdf ? 'PDF guide' : 'Picture guide'} · Tap to view
        </AppText>
      </View>
      <ChevronRight size={icon.md} color={colors.textMuted} />
    </Pressable>
  );
}

export default function ResourcesScreen() {
  const overview = useGetOverviewQuery(undefined, { refetchOnMountOrArgChange: true });
  const [openingKey, setOpeningKey] = useState<string | null>(null);
  const { refreshing, onRefresh } = useRefresh(overview.refetch);
  const resources = overview.data?.resources ?? null;

  const open = async (resource: Resource) => {
    if (openingKey) return;
    setOpeningKey(resource.key);
    try {
      await WebBrowser.openBrowserAsync(`${SERVER_ORIGIN}${resource.file.path}`, {
        toolbarColor: colors.surface,
        controlsColor: colors.primary,
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      });
    } catch {
      Alert.alert('Could not open the guide', 'Check your internet connection and try again.');
    } finally {
      setOpeningKey(null);
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
        Recommended by {resources.doctor ?? 'your doctor'} on {formatDate(resources.date)}.
      </AppText>
      <View style={styles.list}>
        {resources.items.map((item) => (
          <ResourceRow
            key={item.key}
            resource={item}
            opening={openingKey === item.key}
            onOpen={(r) => void open(r)}
          />
        ))}
      </View>
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
  list: { gap: space.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: touch.iconButton + space.lg,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow,
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
