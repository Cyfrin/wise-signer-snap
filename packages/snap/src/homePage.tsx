import { Markdown } from "./markdownFormatter";
import { explainTransaction } from "./ai-explainer";
import type { OnHomePageHandler } from "@metamask/snaps-sdk";
import type { OnUserInputHandler } from "@metamask/snaps-sdk";
import { UserInputEventType } from "@metamask/snaps-sdk";
import { Box, Spinner, Heading, Text, Form, Field, Input, Button, Checkbox, Divider, Bold, Section, Link, Dropdown, Option } from "@metamask/snaps-sdk/jsx";

export const onHomePage: OnHomePageHandler = async () => {
  const state = await snap.request({
    method: "snap_manageState",
    params: { operation: "get" },
  });

  const hasApiKey = !!state?.claudeApiKey;
  const autoExplain = (state?.autoExplain as boolean) ?? true;
  const selectedModel = (state?.selectedModel as string) ?? "claude-sonnet-4-20250514";
  const maxWebSearches = (state?.maxWebSearches as number) ?? 10;

  return {
    content: (
      <Box>
        <Heading>AI Transaction Explainer</Heading>
        <Text>Configure your AI assistant to automatically explain transactions.</Text>

        <Divider />

        {hasApiKey && (
          <Section>
            <Box>
              <Text color="success">✓ API key configured</Text>
              <Text color="muted">Your transactions will be analyzed using Claude AI</Text>
            </Box>
          </Section>
        )}

        <Section>
          <Form name="api-key-form">
            <Field
              label="Claude API Key"
              error={!hasApiKey ? "API key required for AI explanations" : undefined}
            >
              <Input
                name="apiKey"
                type="password"
                placeholder={hasApiKey ? "••••••••••••••••" : "Enter your Claude API key"}
                value=""
              />
            </Field>
            <Box direction="horizontal" alignment="space-between">
              <Button type="submit" name="save-api-key">
                {hasApiKey ? "Update API Key" : "Save API Key"}
              </Button>
              {hasApiKey && (
                <Button
                  type="button"
                  name="remove-api-key"
                  variant="destructive"
                >
                  Remove API Key
                </Button>
              )}
            </Box>
          </Form>
          {!hasApiKey && (
            <Box>
              <Text color="muted">
                Don't have an API key? <Link href="https://console.anthropic.com/settings/workspaces/default/keys">Get one from Claude Console</Link>
              </Text>
            </Box>
          )}
        </Section>

        <Section>
          <Box>
            <Bold>Model Selection</Bold>
            <Text>Choose which Claude model to use for analysis</Text>
            <Dropdown name="model-selector" value={selectedModel}>
              <Option value="claude-opus-4-20250514">Claude Opus 4 (Most Capable)</Option>
              <Option value="claude-sonnet-4-20250514">Claude Sonnet 4 (Balanced)</Option>
              <Option value="claude-3-7-sonnet-20250219">Claude Sonnet 3.7 (Fast)</Option>
            </Dropdown>
          </Box>
        </Section>

        <Section>
          <Box>
            <Bold>Web Search Depth</Bold>
            <Text>More searches = more thorough analysis but higher cost</Text>
            <Dropdown name="web-search-selector" value={maxWebSearches.toString()}>
              <Option value="0">0 searches (None)</Option>
              <Option value="5">5 searches (Basic)</Option>
              <Option value="10">10 searches (Standard)</Option>
              <Option value="20">20 searches (Thorough)</Option>
              <Option value="30">30 searches (Comprehensive)</Option>
            </Dropdown>
            <Text color="muted">Higher values allow AI to research more deeply</Text>
          </Box>
        </Section>

        <Section>
          <Box>
            <Bold>Auto-Explain Transactions</Bold>
            <Text>Automatically analyze transactions when they appear</Text>
            <Checkbox
              name="auto-explain-toggle"
              label="Enable auto-explain"
              variant="toggle"
              checked={autoExplain}
            />
          </Box>
        </Section>
      </Box>
    ),
  };
};

export const onUserInput: OnUserInputHandler = async ({ event, id, context }) => {
  if (event.type === UserInputEventType.FormSubmitEvent && event.name === "api-key-form") {
    const apiKey = event.value?.apiKey as string;

    if (!apiKey || apiKey === "") {
      // Don't update if the field is empty
      return;
    }

    // Get current state
    const currentState = await snap.request({
      method: "snap_manageState",
      params: { operation: "get" },
    }) || {};

    // Update state with new API key
    await snap.request({
      method: "snap_manageState",
      params: {
        operation: "update",
        newState: {
          ...currentState,
          claudeApiKey: apiKey,
        },
      },
    });

    // Update the interface to show the new status
    await snap.request({
      method: 'snap_updateInterface',
      params: {
        id,
        ui: <Text>API Key Updated!</Text>,
      },
    });
  }

  if (event.type === UserInputEventType.ButtonClickEvent && event.name === "remove-api-key") {
    // Get current state
    const currentState = await snap.request({
      method: "snap_manageState",
      params: { operation: "get" },
    }) || {};

    // Remove the API key from state
    const { claudeApiKey, ...stateWithoutApiKey } = currentState;

    // Update state without the API key
    await snap.request({
      method: "snap_manageState",
      params: {
        operation: "update",
        newState: stateWithoutApiKey,
      },
    });

    // Update the interface to show the new status
    await snap.request({
      method: 'snap_updateInterface',
      params: {
        id,
        ui: <Text>API Key Removed!</Text>,
      },
    });
  }

  if (event.type === UserInputEventType.InputChangeEvent && event.name === "model-selector") {
    // Get current state
    const currentState = await snap.request({
      method: "snap_manageState",
      params: { operation: "get" },
    }) || {};

    // Update selected model
    await snap.request({
      method: "snap_manageState",
      params: {
        operation: "update",
        newState: {
          ...currentState,
          selectedModel: event.value,
        },
      },
    });
  }

  if (event.type === UserInputEventType.InputChangeEvent && event.name === "web-search-selector") {
    // Get current state
    const currentState = await snap.request({
      method: "snap_manageState",
      params: { operation: "get" },
    }) || {};

    // Update max web searches
    await snap.request({
      method: "snap_manageState",
      params: {
        operation: "update",
        newState: {
          ...currentState,
          maxWebSearches: parseInt(event.value as string, 10),
        },
      },
    });
  }

  if (event.type === UserInputEventType.InputChangeEvent && event.name === "auto-explain-toggle") {
    // Get current state
    const currentState = await snap.request({
      method: "snap_manageState",
      params: { operation: "get" },
    }) || {};

    // Toggle auto-explain setting
    await snap.request({
      method: "snap_manageState",
      params: {
        operation: "update",
        newState: {
          ...currentState,
          autoExplain: event.value,
        },
      },
    });
  }

  if (event.type === UserInputEventType.ButtonClickEvent && event.name === "ask-ai-analysis") {
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
      txContext.chainId
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
                Source: {txContext.transactionOrigin || "Unknown"}
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
                {aiResponse.error || "Unable to get AI analysis"}
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
    return;
  }
};