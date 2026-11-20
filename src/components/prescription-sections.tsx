import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { prescriptionBlocks } from '@/lib/prescription-blocks';
import { colors, space } from '@/theme/tokens';

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

function ItemText({ item, first }: { item: SectionItem; first: boolean }) {
  return (
    <AppText>
      {first ? '' : '\n'}
      <AppText weight="bold" style={styles.bullet}>
        {'•  '}
      </AppText>
      <AppText weight="semibold">{item.name}</AppText>
      {item.dose ? ` — ${item.dose}` : ''}
      {item.optional ? <AppText tone="muted"> (optional)</AppText> : null}
      {item.instructions ? (
        <AppText variant="label" tone="muted">
          {`\n     How to use: ${item.instructions}`}
        </AppText>
      ) : null}
    </AppText>
  );
}

export function PrescriptionSections({ items }: { items: SectionItem[] }) {
  return (
    <View style={styles.blocks}>
      {prescriptionBlocks(items).map((block) => (
        <View key={block.title} style={styles.block}>
          <PrescriptionHeading title={block.title} />
          <AppText selectable style={styles.body}>
            {block.groups.map((group, groupIndex) => (
              <AppText key={group.name}>
                {groupIndex > 0 ? '\n\n' : ''}
                <AppText variant="label" weight="semibold" tone="muted">
                  {group.name}
                </AppText>
                {'\n'}
                {group.items.map((item, index) => (
                  <ItemText key={`${group.name}-${index}`} item={item} first={index === 0} />
                ))}
              </AppText>
            ))}
          </AppText>
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
  body: { lineHeight: 24 },
  bullet: { color: colors.primary },
});
