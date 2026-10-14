import type { ReactElement } from 'react';
import { FlatList, RefreshControl, StyleSheet, View, type ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardSkeleton, ErrorState } from '@/components/feedback/states';
import { useKeyboardInset } from '@/hooks/use-keyboard-inset';
import { colors, contentMaxWidth, space } from '@/theme/tokens';

interface ListScreenProps<T> {
  data: T[] | undefined;
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T) => string;
  isLoading: boolean;
  error: unknown;
  refreshing: boolean;
  onRefresh: () => void;
  onRetry: () => void;
  header?: ReactElement | null;
  empty: ReactElement;
  gap?: number;
}

export function ListScreen<T>({
  data,
  renderItem,
  keyExtractor,
  isLoading,
  error,
  refreshing,
  onRefresh,
  onRetry,
  header,
  empty,
  gap = space.md,
}: ListScreenProps<T>) {
  const failed = Boolean(error) && !data;
  const { frame, inset } = useKeyboardInset();
  return (
    <SafeAreaView style={styles.root} edges={['left', 'right']}>
      <View ref={frame} style={[styles.root, { paddingBottom: inset }]}>
        <FlatList
          data={isLoading || failed ? [] : data}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.content}
          ItemSeparatorComponent={() => <View style={{ height: gap }} />}
          ListHeaderComponent={header ? <View style={styles.header}>{header}</View> : null}
          ListEmptyComponent={
            isLoading ? (
              <CardSkeleton count={4} />
            ) : failed ? (
              <ErrorState error={error} onRetry={onRetry} retrying={refreshing} />
            ) : (
              empty
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          keyboardShouldPersistTaps="handled"
          initialNumToRender={8}
          windowSize={7}
          removeClippedSubviews={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.xxxl,
    width: '100%',
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
    flexGrow: 1,
  },
  header: { gap: space.md, marginBottom: space.lg },
});
