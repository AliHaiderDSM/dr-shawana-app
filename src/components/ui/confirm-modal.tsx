import { Trash2, type LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { colors, icon, radius, space, touch } from '@/theme/tokens';
import { AppText } from './app-text';

export function ConfirmModal({
  visible,
  title,
  message,
  detail,
  confirmLabel,
  icon: Icon = Trash2,
  busy = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  detail?: string | null;
  confirmLabel: string;
  icon?: LucideIcon;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={busy ? undefined : onCancel}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Close"
          onPress={busy ? undefined : onCancel}
        />
        <View style={styles.card} accessibilityViewIsModal accessibilityRole="alert">
          <View style={styles.badge}>
            <Icon size={icon.lg} color={colors.danger} />
          </View>
          <AppText variant="subheading" center>
            {title}
          </AppText>
          {detail ? (
            <View style={styles.detail}>
              <AppText variant="label" weight="semibold" numberOfLines={2} center>
                {detail}
              </AppText>
            </View>
          ) : null}
          <AppText variant="label" tone="muted" center>
            {message}
          </AppText>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              disabled={busy}
              onPress={onCancel}
              style={({ pressed }) => [styles.button, styles.cancel, pressed && styles.cancelPressed]}
            >
              <AppText weight="semibold" tone="primary">
                Cancel
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              accessibilityState={{ busy }}
              disabled={busy}
              onPress={onConfirm}
              style={({ pressed }) => [styles.button, styles.danger, pressed && styles.dangerPressed]}
            >
              {busy ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <AppText weight="semibold" style={styles.dangerText}>
                  {confirmLabel}
                </AppText>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xxl,
    backgroundColor: colors.overlay,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: space.md,
    padding: space.xxl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerSoft,
  },
  detail: {
    alignSelf: 'stretch',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  actions: { flexDirection: 'row', gap: space.sm, alignSelf: 'stretch', marginTop: space.xs },
  button: {
    flex: 1,
    minHeight: touch.minHeight,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  cancelPressed: { backgroundColor: colors.surfaceMuted },
  danger: { backgroundColor: colors.danger },
  dangerPressed: { opacity: 0.85 },
  dangerText: { color: colors.textInverse },
});
