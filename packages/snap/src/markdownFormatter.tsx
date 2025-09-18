import { Box, Text, Heading, Bold, Italic } from '@metamask/snaps-sdk/jsx';

/**
 * Simple component to render markdown
 * Handles basic markdown: bold (**text**), headings (##), and preserves line breaks
 */
export function Markdown({ children }: { children: string }): JSX.Element {
  if (!children) return <Box><Text> </Text></Box>;

  // Split by paragraphs (double newline)
  const paragraphs = children.split(/\n\s*\n/);

  const elements: JSX.Element[] = [];

  paragraphs.forEach((paragraph, pIndex) => {
    if (!paragraph.trim()) return;

    // Check if it's a heading
    const headingMatch = paragraph.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch && headingMatch[1] && headingMatch[2]) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];

      if (level === 2) {
        elements.push(<Heading key={`h-${pIndex}`}>{content}</Heading>);
      } else {
        elements.push(
          <Text key={`h-${pIndex}`}>
            <Bold>{content}</Bold>
          </Text>
        );
      }
      return;
    }

    // Check if entire paragraph is a code block (starts and ends with ```)
    if (paragraph.startsWith('```') && paragraph.endsWith('```')) {
      const codeContent = paragraph.slice(3, -3).trim();
      elements.push(
        <Box key={`code-${pIndex}`}>
          <Text color="alternative">{codeContent}</Text>
        </Box>
      );
      return;
    }

    // Process paragraph for bold text and inline code
    const parts: (string | JSX.Element)[] = [];
    let text = paragraph;
    let partIndex = 0;

    // Process the text character by character to handle both ** and ` markers
    while (text.length > 0) {
      // Check for bold text
      if (text.startsWith('**')) {
        const endIndex = text.indexOf('**', 2);
        if (endIndex !== -1) {
          const boldText = text.substring(2, endIndex);
          parts.push(<Bold key={`b-${pIndex}-${partIndex++}`}>{boldText}</Bold>);
          text = text.substring(endIndex + 2);
          continue;
        }
      }

      // Check for inline code - we'll keep the backticks for clarity
      // since we can't style inline code differently in Metamask Snaps
      if (text.startsWith('`')) {
        const endIndex = text.indexOf('`', 1);
        if (endIndex !== -1) {
          // Keep the backticks to indicate it's code
          const codeText = text.substring(1, endIndex);
          parts.push(<Italic key={`b-${pIndex}-${partIndex++}`}>{codeText}</Italic>);
          text = text.substring(endIndex + 1);
          continue;
        }
      }

      // Find the next special character
      let nextSpecial = text.length;
      const nextBold = text.indexOf('**');
      const nextCode = text.indexOf('`');

      if (nextBold !== -1 && nextBold < nextSpecial) nextSpecial = nextBold;
      if (nextCode !== -1 && nextCode < nextSpecial) nextSpecial = nextCode;

      // Add regular text up to the next special character
      if (nextSpecial > 0) {
        parts.push(text.substring(0, nextSpecial));
        text = text.substring(nextSpecial);
      } else {
        // No more special characters, add the rest
        parts.push(text);
        text = '';
      }
    }

    // Add the paragraph with all its parts
    if (parts.length > 0) {
      elements.push(
        <Text key={`p-${pIndex}`}>
          {parts}
        </Text>
      );
    } else {
      elements.push(
        <Text key={`p-${pIndex}`}>
          {paragraph}
        </Text>
      );
    }
  });

  // Ensure we always return something
  if (elements.length === 0) {
    return <Box><Text> </Text></Box>;
  }

  return <Box>{elements}</Box>;
}