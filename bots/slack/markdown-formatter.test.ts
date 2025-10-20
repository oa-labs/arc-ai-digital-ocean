import { describe, it, expect } from 'vitest';

/**
 * Decodes HTML entities in text - DUPLICATED FOR TESTING
 * Handles both named entities (&amp;) and numeric entities (&#123; or &#x7B;)
 */
const decodeHtmlEntities = (text: string): string => {
  return text
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
};

describe('decodeHtmlEntities', () => {
  it('should decode hex entities', () => {
    const input = '&#x61;&#x62;&#x63;';
    const expected = 'abc';
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  it('should decode decimal entities', () => {
    const input = '&#97;&#98;&#99;';
    const expected = 'abc';
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  it('should decode mixed hex and decimal entities', () => {
    const input = '&#97;&#x6e;&#100;&#x72;&#101;&#x77;';
    const expected = 'andrew';
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  it('should decode the full email address from the issue', () => {
    const input = '&#97;&#x6e;&#100;&#x72;&#101;&#x77;&#x62;&#111;&#x65;&#x68;&#109;&#64;&#x6f;&#112;&#x65;&#x6e;&#97;&#x72;&#x63;&#46;&#110;&#101;&#116;';
    const expected = 'andrewboehm@openarc.net';
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  it('should decode named entities', () => {
    const input = '&lt;hello&gt; &amp; &quot;world&quot;';
    const expected = '<hello> & "world"';
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  it('should handle text without entities', () => {
    const input = 'hello world';
    const expected = 'hello world';
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  it('should handle mixed text and entities', () => {
    const input = 'Email: &#97;&#x62;&#99;&#64;example.com';
    const expected = 'Email: abc@example.com';
    expect(decodeHtmlEntities(input)).toBe(expected);
  });
});

/**
 * Removes citation references - DUPLICATED FOR TESTING
 */
const removeCitations = (text: string): string => {
  const citationPattern = /\[\[C\d+\]\]/g;
  return text.replace(citationPattern, '');
};

describe('removeCitations', () => {
  it('should remove single citation reference', () => {
    const input = 'This is a fact [[C1]].';
    const expected = 'This is a fact .';
    expect(removeCitations(input)).toBe(expected);
  });

  it('should remove multiple citation references', () => {
    const input = 'First fact [[C1]] and second fact [[C2]].';
    const expected = 'First fact  and second fact .';
    expect(removeCitations(input)).toBe(expected);
  });

  it('should remove multi-digit citation references', () => {
    const input = 'This is cited [[C123]].';
    const expected = 'This is cited .';
    expect(removeCitations(input)).toBe(expected);
  });

  it('should handle text without citations', () => {
    const input = 'This is plain text.';
    const expected = 'This is plain text.';
    expect(removeCitations(input)).toBe(expected);
  });

  it('should handle multiple citations in a row', () => {
    const input = 'Facts [[C1]][[C2]][[C3]].';
    const expected = 'Facts .';
    expect(removeCitations(input)).toBe(expected);
  });

  it('should handle citations at different positions', () => {
    const input = '[[C1]] Start, middle [[C2]], and end [[C3]]';
    const expected = ' Start, middle , and end ';
    expect(removeCitations(input)).toBe(expected);
  });

  it('should not remove similar but invalid patterns', () => {
    const input = 'Code [C1] and [[C]] and [[1]] should stay';
    const expected = 'Code [C1] and [[C]] and [[1]] should stay';
    expect(removeCitations(input)).toBe(expected);
  });
});
