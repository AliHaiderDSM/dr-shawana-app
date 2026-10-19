import { StyleSheet, View } from 'react-native';
import { htmlToMarkup, inlineRuns } from '@/lib/rich-text';
import { space } from '@/theme/tokens';
import { AppText } from './app-text';

function Line({ text }: { text: string }) {
  return (
    <AppText>
      {inlineRuns(text).map((run, index) => (
        <AppText
          key={index}
          weight={run.bold ? 'bold' : undefined}
          style={run.italic ? styles.italic : undefined}
        >
          {run.text}
        </AppText>
      ))}
    </AppText>
  );
}

export function RichTextView({ html }: { html: string | null | undefined }) {
  const lines = htmlToMarkup(html).split('\n');
  return (
    <View style={styles.wrap}>
      {lines.map((line, index) => {
        const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
        const number = /^\s*(\d+)[.)]\s+(.*)$/.exec(line);
        if (!line.trim()) return <View key={index} style={styles.gap} />;
        if (bullet || number)
          return (
            <View key={index} style={styles.item}>
              <AppText weight="semibold" style={styles.marker}>
                {bullet ? '•' : `${number![1]}.`}
              </AppText>
              <View style={styles.flex}>
                <Line text={bullet ? bullet[1]! : number![2]!} />
              </View>
            </View>
          );
        return <Line key={index} text={line} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  gap: { height: space.xs },
  item: { flexDirection: 'row', gap: space.sm },
  marker: { minWidth: 18 },
  flex: { flex: 1, minWidth: 0 },
  italic: { fontStyle: 'italic' },
});
