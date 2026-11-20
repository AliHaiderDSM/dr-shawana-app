import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon';
import { colors, radius, shadow, space } from '@/theme/tokens';

export function MessagesTabButton({
  onPress,
  focused,
  unread,
  hint,
}: {
  onPress?: () => void;
  focused: boolean;
  unread: number;
  hint: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={unread > 0 ? `Messages, ${unread} new` : 'Messages'}
      accessibilityHint={hint}
      accessibilityState={{ selected: focused }}
      style={styles.wrap}
    >
      {({ pressed }) => (
        <>
          <View style={[styles.button, pressed && styles.pressed]}>
            <WhatsAppIcon size={28} color={colors.textInverse} />
            {unread > 0 ? (
              <View style={styles.badge}>
                <AppText variant="caption" weight="bold" style={styles.badgeText}>
                  {unread > 99 ? '99+' : unread}
                </AppText>
              </View>
            ) : null}
          </View>
          <AppText variant="caption" weight="semibold" tone={focused ? 'primary' : 'muted'} numberOfLines={1}>
            Messages
          </AppText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: space.xs, gap: 2 },
  button: {
    width: 54,
    height: 54,
    marginTop: -20,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.surface,
    ...shadow,
  },
  pressed: { backgroundColor: colors.primaryPressed },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.textInverse, fontSize: 10, lineHeight: 12 },
});
