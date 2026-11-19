import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { StatusBadge } from '@/components/ui/status-badge';
import { prescriptionBlocks } from '@/lib/prescription-blocks';
import { colors, radius, space } from '@/theme/tokens';

export interface SectionItem {
  category: string;
  groupName: string | null;
  name: string;
  dose: string | null;
  instructions: string | null;
  optional?: boolean;
}

export function PrescriptionHeading({ title }: { title: string }) {
  return (
    <View style={styles.heading}>
      <AppText
        variant="subheading"
        weight="bold"
        tone="primary"
        accessibilityRole="header"
        style={styles.upper}
      >
        {title}
      </AppText>
    </View>
  );
}

function ItemRow({ item, first }: { item: SectionItem; first: boolean }) {
  return (
    <View style={[styles.item, !first && styles.itemBorder]}>
      <View style={styles.itemHead}>
        <View style={styles.bullet} />
        <AppText weight="semibold" style={styles.flex}>
          {item.name}
          {item.dose ? <AppText weight="regular"> — {item.dose}</AppText> : null}
        </AppText>
        {item.optional ? <StatusBadge label="Optional" tone="neutral" /> : null}
      </View>
      {item.instructions ? (
        <AppText variant="label" tone="muted" style={styles.indent}>
          How to use: {item.instructions}
        </AppText>
      ) : null}
    </View>
  );
}

export function PrescriptionSections({ items }: { items: SectionItem[] }) {
  return (
    <View style={styles.blocks}>
      {prescriptionBlocks(items).map((block) => (
        <View key={block.title} style={styles.block}>
          <PrescriptionHeading title={block.title} />
          {block.groups.map((group) => (
            <View key={group.name} style={styles.group}>
              <AppText variant="label" weight="semibold" tone="muted">
                {group.name}
              </AppText>
              {group.items.map((item, index) => (
                <ItemRow key={`${group.name}-${index}`} item={item} first={index === 0} />
              ))}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  blocks: { gap: space.lg },
  block: { gap: space.sm },
  heading: {
    paddingBottom: space.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  upper: { textTransform: 'uppercase', letterSpacing: 0.6 },
  group: { gap: space.xxs },
  item: { gap: space.xxs, paddingVertical: space.xs },
  itemBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  bullet: { width: 6, height: 6, borderRadius: radius.pill, backgroundColor: colors.primary },
  indent: { paddingLeft: space.md },
  flex: { flex: 1, minWidth: 0 },
});
