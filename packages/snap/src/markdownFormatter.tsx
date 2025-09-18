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

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    
    // Check for headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch?.[1] && headingMatch[2]) {
      parts.push({
        type: 'heading',
        content: headingMatch[2],
        level: headingMatch[1].length,
      });
      if (lineIndex < lines.length - 1) {
        parts.push({ type: 'text', content: '\n' });
      }
      continue;
    }

    // Parse inline elements - process the entire line at once
    let currentPos = 0;
    let lineContent = '';
    
    while (currentPos < line.length) {
      // Check for inline code
      if (line[currentPos] === '`') {
        // Add any accumulated regular text
        if (lineContent) {
          parts.push({ type: 'text', content: lineContent });
          lineContent = '';
        }
        
        // Find closing backtick
        const closeIndex = line.indexOf('`', currentPos + 1);
        if (closeIndex !== -1) {
          const codeContent = line.slice(currentPos + 1, closeIndex);
          parts.push({ type: 'code', content: codeContent });
          currentPos = closeIndex + 1;
          continue;
        }
      }
      
      // Check for bold text
      if (line.slice(currentPos, currentPos + 2) === '**') {
        // Add any accumulated regular text
        if (lineContent) {
          parts.push({ type: 'text', content: lineContent });
          lineContent = '';
        }
        
        // Find closing **
        const closeIndex = line.indexOf('**', currentPos + 2);
        if (closeIndex !== -1) {
          const boldContent = line.slice(currentPos + 2, closeIndex);
          parts.push({ type: 'bold', content: boldContent });
          currentPos = closeIndex + 2;
          continue;
        }
      }
      
      // Regular character - accumulate
      lineContent += line[currentPos];
      currentPos++;
    }
    
    // Add any remaining text from the line
    if (lineContent) {
      parts.push({ type: 'text', content: lineContent });
    }
    
    // Add newline if not the last line
    if (lineIndex < lines.length - 1) {
      parts.push({ type: 'text', content: '\n' });
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
  const elements: JSX.Element[] = [];
  let currentTextContent: (string | JSX.Element)[] = [];
  
  const flushText = () => {
    if (currentTextContent.length > 0) {
      elements.push(
        <Text key={`text-${elements.length}`}>
          {currentTextContent}
        </Text>
      );
      currentTextContent = [];
    }
  };

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const key = `md-${i}`;

    switch (part.type) {
      case 'heading':
        flushText();
        if (part.level === 2) {
          elements.push(<Heading key={key}>{part.content}</Heading>);
        } else {
          elements.push(
            <Text key={key}>
              <Bold>{part.content}</Bold>
            </Text>
          );
        }
        break;

      case 'codeblock':
        flushText();
        elements.push(
          <Box key={key}>
            <Text color="alternative">{part.content}</Text>
          </Box>
        );
        break;

      case 'code':
        // Inline code - add to current text content with styling
        currentTextContent.push(
          <Text key={key} color="alternative">
            {part.content}
          </Text>
        );
        break;

      case 'bold':
        // Bold text - add to current text content
        currentTextContent.push(
          <Bold key={key}>{part.content}</Bold>
        );
        break;

      case 'text':
        // Regular text - add to current text content
        currentTextContent.push(part.content);
        break;
    }
  }

  flushText();
  return <Box>{elements}</Box>;
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