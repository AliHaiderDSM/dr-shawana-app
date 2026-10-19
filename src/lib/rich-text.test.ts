import { describe, expect, it } from '@jest/globals';
import { htmlToMarkup, inlineRuns, markupToHtml } from './rich-text';

describe('rich text', () => {
  it('turns dashboard HTML into simple markup and back', () => {
    const html =
      '<p><strong>Start</strong> BHRT &amp; <em>review</em></p><ul><li><p>Labs</p></li><li><p>DEXA</p></li></ul><ol><li><p>One</p></li><li><p>Two</p></li></ol>';
    const markup = htmlToMarkup(html);
    expect(markup).toBe('**Start** BHRT & _review_\n\n- Labs\n- DEXA\n\n1. One\n2. Two');
    expect(markupToHtml(markup)).toBe(
      '<p><strong>Start</strong> BHRT &amp; <em>review</em></p><ul><li><p>Labs</p></li><li><p>DEXA</p></li></ul><ol><li><p>One</p></li><li><p>Two</p></li></ol>',
    );
  });

  it('keeps plain text and escapes markup', () => {
    expect(htmlToMarkup('Plain note')).toBe('Plain note');
    expect(markupToHtml('a < b')).toBe('<p>a &lt; b</p>');
    expect(markupToHtml('   ')).toBeNull();
  });

  it('splits bold and italic runs for display', () => {
    expect(inlineRuns('Take **two** tabs _daily_ now')).toEqual([
      { text: 'Take ', bold: false, italic: false },
      { text: 'two', bold: true, italic: false },
      { text: ' tabs ', bold: false, italic: false },
      { text: 'daily', bold: false, italic: true },
      { text: ' now', bold: false, italic: false },
    ]);
  });
});
