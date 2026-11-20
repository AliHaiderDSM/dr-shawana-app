import { StyleSheet } from 'react-native';
import { htmlToMarkup, inlineRuns } from '@/lib/rich-text';
import { AppText } from './app-text';

function Runs({ text }: { text: string }) {
  return (
    <>
      {inlineRuns(text).map((run, index) => (
        <AppText
          key={index}
          weight={run.bold ? 'bold' : undefined}
          style={run.italic ? styles.italic : undefined}
        >
          {run.text}
        </AppText>
      ))}
    </>
  );
}

function lineParts(line: string) {
  const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
  if (bullet) return { marker: '•  ', text: bullet[1] ?? '' };
  const number = /^\s*(\d+)[.)]\s+(.*)$/.exec(line);
  if (number) return { marker: `${number[1]}.  `, text: number[2] ?? '' };
  return { marker: '', text: line };
}

export function RichTextView({ html }: { html: string | null | undefined }) {
  const lines = htmlToMarkup(html)
    .split('\n')
    .map((line) => line.trimEnd());
  return (
    <AppText selectable style={styles.text}>
      {lines.map((line, index) => {
        const { marker, text } = lineParts(line);
        return (
          <AppText key={index}>
            {index > 0 ? '\n' : ''}
            {marker ? <AppText weight="semibold">{marker}</AppText> : null}
            <Runs text={text} />
          </AppText>
        );
      })}
    </AppText>
  );
}

const styles = StyleSheet.create({
  text: { lineHeight: 24 },
  italic: { fontStyle: 'italic' },
});
