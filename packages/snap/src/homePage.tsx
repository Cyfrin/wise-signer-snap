import type {
  OnHomePageHandler,
  OnUserInputHandler,
} from '@metamask/snaps-sdk';
import { UserInputEventType } from '@metamask/snaps-sdk';
import {
  Box,
  Spinner,
  Heading,
  Text,
  Form,
  Field,
  Input,
  Button,
  Checkbox,
  Divider,
  Bold,
  Section,
  Link,
  Dropdown,
  Option,
} from '@metamask/snaps-sdk/jsx';

import { explainTransaction } from './ai-explainer';
import {
  DEFAULT_MAX_WEB_SEARCHES,
  DEFAULT_AUTO_EXPLAIN,
  resolveModel,
} from './constants';
import { Markdown } from './markdownFormatter';

type HomeNotice = { text: string; color: 'success' | 'error' };

/**
 * Builds the home-page UI from current state. Shared by `onHomePage` and the
 * save/remove handlers so those handlers re-render the full page (with an
 * optional status notice) instead of replacing it with a dead-end message.
 *
 * @param state - The current snap state.
 * @param notice - Optional status banner to show at the top.
 * @returns The home-page UI element.
 */
function buildHomePageContent(state: any, notice?: HomeNotice): JSX.Element {
  const hasApiKey = Boolean(state?.claudeApiKey);
  const autoExplain = (state?.autoExplain as boolean) ?? DEFAULT_AUTO_EXPLAIN;
  const selectedModel = resolveModel(state?.selectedModel);
  const maxWebSearches =
    (state?.maxWebSearches as number) ?? DEFAULT_MAX_WEB_SEARCHES;

  return (
    <Box>
      {notice ? <Text color={notice.color}>{notice.text}</Text> : null}
      <Heading>AI Transaction Explainer</Heading>
      <Text>
        Configure your AI assistant to automatically explain transactions.
      </Text>

      <Divider />

      {hasApiKey && (
        <Section>
          <Box>
            <Text color="success">✓ API key configured</Text>
            <Text color="muted">
              Your transactions will be analyzed using Claude AI
            </Text>
          </Box>
        </Section>
      )}

      <Section>
        <Form name="api-key-form">
          <Field
            label="Claude API Key"
            error={
              hasApiKey ? undefined : 'API key required for AI explanations'
            }
          >
            <Input
              name="apiKey"
              type="password"
              placeholder={
                hasApiKey ? '••••••••••••••••' : 'Enter your Claude API key'
              }
              value=""
            />
          </Field>
          <Box direction="horizontal" alignment="space-between">
            <Button type="submit" name="save-api-key">
              {hasApiKey ? 'Update API Key' : 'Save API Key'}
            </Button>
            {hasApiKey && (
              <Button type="button" name="remove-api-key" variant="destructive">
                Remove API Key
              </Button>
            )}
          </Box>
        </Form>
        {!hasApiKey && (
          <Box>
            <Text color="muted">
              Don't have an API key?{' '}
              <Link href="https://console.anthropic.com/settings/workspaces/default/keys">
                Get one from Claude Console
              </Link>
            </Text>
          </Box>
        )}
      </Section>

      <Section>
        <Box>
          <Bold>Model Selection</Bold>
          <Text>Choose which Claude model to use for analysis</Text>
          <Dropdown name="model-selector" value={selectedModel}>
            <Option value="claude-opus-4-8">
              Claude Opus 4.8 (Most Capable)
            </Option>
            <Option value="claude-sonnet-4-6">
              Claude Sonnet 4.6 (Balanced)
            </Option>
            <Option value="claude-haiku-4-5">
              Claude Haiku 4.5 (Fastest &amp; Cheapest)
            </Option>
            <Option value="claude-fable-5">Claude Fable 5 (Premium)</Option>
          </Dropdown>
        </Box>
      </Section>

      <Section>
        <Box>
          <Bold>Web Search Depth</Bold>
          <Text>More searches = more thorough analysis but higher cost</Text>
          <Dropdown
            name="web-search-selector"
            value={maxWebSearches.toString()}
          >
            <Option value="1">1 search (One)</Option>
            <Option value="5">5 searches (Basic)</Option>
            <Option value="10">10 searches (Standard)</Option>
            <Option value="20">20 searches (Thorough)</Option>
            <Option value="30">30 searches (Comprehensive)</Option>
          </Dropdown>
          <Text color="muted">
            Higher values allow AI to research more deeply
          </Text>
        </Box>
      </Section>

      <Section>
        <Box>
          <Bold>Auto-Explain Transactions</Bold>
          <Text>
            Automatically analyze transactions when they appear (each analysis
            bills your API key)
          </Text>
          <Checkbox
            name="auto-explain-toggle"
            label="Enable auto-explain"
            variant="toggle"
            checked={autoExplain}
          />
        </Box>
      </Section>
    </Box>
  );
}

export const onHomePage: OnHomePageHandler = async () => {
  const state = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  });

  return { content: buildHomePageContent(state) };
};

export const onUserInput: OnUserInputHandler = async ({
  event,
  id,
  context,
}) => {
  if (
    event.type === UserInputEventType.FormSubmitEvent &&
    event.name === 'api-key-form'
  ) {
    const apiKey = (event.value?.apiKey as string)?.trim();

    const currentState =
      (await snap.request({
        method: 'snap_manageState',
        params: { operation: 'get' },
      })) ?? {};

    // Empty submit: keep the existing key (if any) and just re-render.
    if (!apiKey) {
      const notice: HomeNotice | undefined = currentState.claudeApiKey
        ? undefined
        : { text: 'Enter an API key before saving.', color: 'error' };
      await snap.request({
        method: 'snap_updateInterface',
        params: { id, ui: buildHomePageContent(currentState, notice) },
      });
      return;
    }

    // Cheap format check to catch the common paste error before it costs a call.
    if (!apiKey.startsWith('sk-ant-')) {
      await snap.request({
        method: 'snap_updateInterface',
        params: {
          id,
          ui: buildHomePageContent(currentState, {
            text: 'That does not look like a Claude API key (it should start with "sk-ant-").',
            color: 'error',
          }),
        },
      });
      return;
    }

    const newState = { ...currentState, claudeApiKey: apiKey };
    await snap.request({
      method: 'snap_manageState',
      params: { operation: 'update', newState },
    });

    await snap.request({
      method: 'snap_updateInterface',
      params: {
        id,
        ui: buildHomePageContent(newState, {
          text: '✓ API key saved.',
          color: 'success',
        }),
      },
    });
    return;
  }

  if (
    event.type === UserInputEventType.ButtonClickEvent &&
    event.name === 'remove-api-key'
  ) {
    const currentState =
      (await snap.request({
        method: 'snap_manageState',
        params: { operation: 'get' },
      })) ?? {};

    const { claudeApiKey, ...stateWithoutApiKey } = currentState;

    await snap.request({
      method: 'snap_manageState',
      params: { operation: 'update', newState: stateWithoutApiKey },
    });

    await snap.request({
      method: 'snap_updateInterface',
      params: {
        id,
        ui: buildHomePageContent(stateWithoutApiKey, {
          text: 'API key removed.',
          color: 'success',
        }),
      },
    });
    return;
  }

  if (
    event.type === UserInputEventType.InputChangeEvent &&
    event.name === 'model-selector'
  ) {
    const currentState =
      (await snap.request({
        method: 'snap_manageState',
        params: { operation: 'get' },
      })) ?? {};

    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: {
          ...currentState,
          selectedModel: event.value,
        },
      },
    });
  }

  if (
    event.type === UserInputEventType.InputChangeEvent &&
    event.name === 'web-search-selector'
  ) {
    const currentState =
      (await snap.request({
        method: 'snap_manageState',
        params: { operation: 'get' },
      })) ?? {};

    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: {
          ...currentState,
          maxWebSearches: parseInt(event.value as string, 10),
        },
      },
    });
  }

  if (
    event.type === UserInputEventType.InputChangeEvent &&
    event.name === 'auto-explain-toggle'
  ) {
    const currentState =
      (await snap.request({
        method: 'snap_manageState',
        params: { operation: 'get' },
      })) ?? {};

    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: {
          ...currentState,
          autoExplain: event.value,
        },
      },
    });
  }

  if (
    event.type === UserInputEventType.ButtonClickEvent &&
    event.name === 'ask-ai-analysis'
  ) {
    // Show loading state
    await snap.request({
      method: 'snap_updateInterface',
      params: {
        id,
        ui: (
          <Box>
            <Heading>Analyzing Transaction...</Heading>
            <Spinner />
            <Text>Please wait while AI analyzes your transaction</Text>
          </Box>
        ),
      },
    });

    // Get transaction data from context
    const txContext = context as {
      processedResult: string;
      to: string;
      from: string;
      value: string;
      chainId: string;
      transactionOrigin?: string;
    };

    // Get AI explanation
    const aiResponse = await explainTransaction(
      txContext.processedResult,
      txContext.to,
      txContext.from,
      txContext.value,
      txContext.chainId,
    );

    if (aiResponse.success && aiResponse.explanation) {
      await snap.request({
        method: 'snap_updateInterface',
        params: {
          id,
          ui: (
            <Box>
              <Heading>AI Transaction Analysis</Heading>
              <Markdown>{aiResponse.explanation}</Markdown>
              <Text color="muted">
                Source: {txContext.transactionOrigin ?? 'Unknown'}
              </Text>
            </Box>
          ),
        },
      });
    } else {
      await snap.request({
        method: 'snap_updateInterface',
        params: {
          id,
          ui: (
            <Box>
              <Heading>AI Analysis Failed</Heading>
              <Text color="error">
                {aiResponse.error ?? 'Unable to get AI analysis'}
              </Text>
              {aiResponse.errorType === 'NO_API_KEY' && (
                <Text color="warning">
                  Please configure your Claude API key in the Snap home page.
                </Text>
              )}
            </Box>
          ),
        },
      });
    }
  }
};
