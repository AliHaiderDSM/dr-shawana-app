import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, contentMaxWidth, space } from '@/theme/tokens';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  keyboard?: boolean;
  edges?: Edge[];
  refreshing?: boolean;
  onRefresh?: () => void;
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({
  children,
  scroll = true,
  keyboard = false,
  edges = ['left', 'right'],
  refreshing,
  onRefresh,
  footer,
  contentStyle,
}: ScreenProps) {
  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
    >
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.content, contentStyle]}>
      <View style={[styles.inner, styles.flex]}>{children}</View>
    </View>
  );

  const content = (
    <>
      {body}
      {footer ? (
        <View style={styles.footer}>
          <View style={styles.inner}>{footer}</View>
        </View>
      ) : null}
    </>
  );

  return (
    <SafeAreaView style={styles.root} edges={edges}>
      {keyboard ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xxxl },
  inner: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', gap: space.lg },
  footer: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
