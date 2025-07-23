import { Box, Text, Heading, Bold } from '@metamask/snaps-sdk/jsx';

type MarkdownPart = {
  type: 'text' | 'code' | 'codeblock' | 'heading' | 'bold';
  content: string;
  level?: number;
};

/**
 * Parse markdown string into parts
 *
 * @param text
 */
function parseMarkdown(text: string): MarkdownPart[] {
  const parts: MarkdownPart[] = [];

  // Split by code blocks first (triple backticks)
  const codeBlockRegex = /```([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      parts.push(...parseInlineMarkdown(beforeText));
    }

    // Add code block
    parts.push({
      type: 'codeblock',
      content: match[1]?.trim() || '',
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(...parseInlineMarkdown(text.slice(lastIndex)));
  }

  return parts;
}

/**
 * Parse inline markdown (headings, inline code, bold)
 *
 * @param text
 */
function parseInlineMarkdown(text: string): MarkdownPart[] {
  const parts: MarkdownPart[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    // Check for headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch?.[1] && headingMatch[2]) {
      parts.push({
        type: 'heading',
        content: headingMatch[2],
        level: headingMatch[1].length,
      });
      continue;
    }

    // Parse inline elements (code and bold)
    const inlineRegex = /(`[^`]+`)|(\*\*[^*]+\*\*)|([^`*]+)/g;
    let inlineMatch;

    while ((inlineMatch = inlineRegex.exec(line)) !== null) {
      if (inlineMatch[1]) {
        // Inline code
        parts.push({
          type: 'code',
          content: inlineMatch[1].slice(1, -1), // Remove backticks
        });
      } else if (inlineMatch[2]) {
        // Bold text
        parts.push({
          type: 'bold',
          content: inlineMatch[2].slice(2, -2), // Remove asterisks
        });
      } else if (inlineMatch[3]) {
        // Regular text
        parts.push({
          type: 'text',
          content: inlineMatch[3],
        });
      }
    }

    // Add newline as text if not the last line
    if (line !== lines[lines.length - 1]) {
      parts.push({
        type: 'text',
        content: '\n',
      });
    }
  }

  return parts;
}

/**
 * Render markdown parts as JSX
 *
 * @param text
 */
export function renderMarkdown(text: string): JSX.Element {
  const parts = parseMarkdown(text);

  return (
    <Box>
      {parts.map((part, index) => {
        const key = `md-${index}`;

        switch (part.type) {
          case 'heading':
            // Only support h2 (##) as Heading component
            if (part.level === 2) {
              return <Heading key={key}>{part.content}</Heading>;
            }
            // For other heading levels, use bold text
            return (
              <Text key={key}>
                <Bold>{part.content}</Bold>
              </Text>
            );

          case 'codeblock':
            return (
              <Box key={key}>
                <Text color="alternative">{part.content}</Text>
              </Box>
            );

          case 'code':
            return (
              <Text key={key} color="alternative">
                `{part.content}`
              </Text>
            );

          case 'bold':
            return (
              <Text key={key}>
                <Bold>{part.content}</Bold>
              </Text>
            );

          case 'text':
            return <Text key={key}>{part.content}</Text>;

          default:
            return <Text key={key}>{part.content}</Text>;
        }
      })}
    </Box>
  );
}

/**
 * Simple component to render markdown
 *
 * @param options0
 * @param options0.children
 */
export function Markdown({ children }: { children: string }): JSX.Element {
  return renderMarkdown(children);
}
