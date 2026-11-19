import { Check, Plus, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { colors, fontSize, icon, maxFontScale, radius, space, touch } from '@/theme/tokens';
import type { PlanOption } from '@/redux/features/doctor';

function groupOptions(options: PlanOption[], search: string) {
  const term = search.trim().toLowerCase();
  const groups = new Map<string, PlanOption[]>();
  for (const option of options) {
    if (term && !`${option.name} ${option.groupName}`.toLowerCase().includes(term)) continue;
    groups.set(option.groupName, [...(groups.get(option.groupName) ?? []), option]);
  }
  return [...groups];
}

function OptionRow({ option, on, onToggle }: { option: PlanOption; on: boolean; onToggle: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={option.name}
      onPress={onToggle}
      style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
    >
      <View style={[styles.box, on && styles.boxOn]}>
        {on ? <Check size={14} color={colors.textInverse} strokeWidth={3} /> : null}
      </View>
      <View style={styles.flex}>
        <AppText variant="label" weight={on ? 'semibold' : 'regular'}>
          {option.name}
        </AppText>
        {option.dose ? (
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {option.dose}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

export function PlanItemPicker({
  title,
  addLabel,
  options,
  selected,
  loading,
  onToggle,
  defaultOpen = false,
}: {
  title: string;
  addLabel: string;
  options: PlanOption[];
  selected: string[];
  loading: boolean;
  onToggle: (id: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [search, setSearch] = useState('');
  const groups = useMemo(() => groupOptions(options, search), [options, search]);
  const chosen = options.filter((o) => selected.includes(o.id));

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <AppText weight="semibold" style={styles.flex}>
          {title}
          {chosen.length ? ` (${chosen.length})` : ''}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={open ? `Done choosing ${title}` : addLabel}
          onPress={() => setOpen((v) => !v)}
          hitSlop={6}
          style={({ pressed }) => [styles.toggle, pressed && styles.togglePressed]}
        >
          {open ? null : <Plus size={icon.sm} color={colors.primary} />}
          <AppText variant="label" weight="semibold" tone="primary">
            {open ? 'Done' : 'Add'}
          </AppText>
        </Pressable>
      </View>

      {chosen.length ? (
        <View style={styles.chips}>
          {chosen.map((o) => (
            <Pressable
              key={o.id}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${o.name}`}
              onPress={() => onToggle(o.id)}
              style={styles.chip}
            >
              <AppText
                variant="caption"
                weight="semibold"
                tone="primary"
                numberOfLines={1}
                style={styles.chipText}
              >
                {o.name}
              </AppText>
              <X size={12} color={colors.primary} />
            </Pressable>
          ))}
        </View>
      ) : open ? null : (
        <AppText variant="caption" tone="muted">
          Nothing added. Tap Add to tick from the list.
        </AppText>
      )}

      {open ? (
        <View style={styles.list}>
          <View style={styles.search}>
            <Search size={icon.sm} color={colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={`Search ${title.toLowerCase()}`}
              placeholderTextColor={colors.textMuted}
              maxFontSizeMultiplier={maxFontScale}
              accessibilityLabel={`Search ${title.toLowerCase()}`}
              style={styles.searchInput}
            />
          </View>
          {loading ? <ActivityIndicator color={colors.primary} /> : null}
          {!loading && groups.length === 0 ? (
            <AppText variant="caption" tone="muted">
              Nothing found.
            </AppText>
          ) : null}
          {groups.map(([group, list]) => (
            <View key={group} style={styles.group}>
              <AppText variant="caption" weight="bold" tone="muted" style={styles.upper}>
                {group}
              </AppText>
              {list.map((o) => (
                <OptionRow
                  key={o.id}
                  option={o}
                  on={selected.includes(o.id)}
                  onToggle={() => onToggle(o.id)}
                />
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  card: {
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xxs,
    paddingHorizontal: space.md,
    minHeight: touch.iconButton - 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  togglePressed: { opacity: 0.8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xxs,
    maxWidth: '100%',
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  chipText: { flexShrink: 1 },
  list: { gap: space.sm },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.sm,
    minHeight: touch.minHeight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  searchInput: { flex: 1, fontSize: fontSize.md, color: colors.text, paddingVertical: space.xs },
  group: { gap: space.xxs },
  upper: { textTransform: 'uppercase', letterSpacing: 0.6 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.xs,
    paddingHorizontal: space.xs,
    minHeight: touch.minHeight - 4,
    borderRadius: radius.sm,
  },
  optionPressed: { backgroundColor: colors.surfaceMuted },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
