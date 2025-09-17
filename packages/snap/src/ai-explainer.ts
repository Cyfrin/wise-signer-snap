import Anthropic from "@anthropic-ai/sdk";
import { Message } from "@anthropic-ai/sdk/resources/messages";
import { SYSTEM_PROMPT, generateMessagePrompt } from "./constants";

export interface ExplanationResult {
  success: boolean;
  explanation?: string;
  error?: string;
  errorType?: 'NO_API_KEY' | 'AUTH' | 'RATE_LIMIT' | 'NETWORK' | 'UNKNOWN';
}

export async function explainTransaction(
  decodedTx: string,
  to: string,
  from: string,
  value: string,
  chainId: string
): Promise<ExplanationResult> {
  try {
    // Get stored API key from snap state
    const state = await snap.request({
      method: "snap_manageState",
      params: { operation: "get" },
    });

    const apiKey = state?.claudeApiKey as string | undefined;
    const selectedModel = (state?.selectedModel as string) ?? "claude-sonnet-4-20250514";
    const maxWebSearches = (state?.maxWebSearches as number) ?? 10;

    if (!apiKey) {
      return {
        success: false,
        error: "Claude API key not configured. Please set it on the Snap home page.",
        errorType: 'NO_API_KEY'
      };
    }

    const anthropic = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true
    });

    console.log("Calling Claude API...");

    const msg = await anthropic.beta.messages.create({
      model: selectedModel,
      max_tokens: 20000,
      temperature: 1,
      system: SYSTEM_PROMPT,
      messages: [
        {
          "role": "user",
          "content": [
            {
              "type": "text",
              "text": generateMessagePrompt(decodedTx, to, from, value, chainId)
            }
          ]
        }
      ],
      tools: [
        {
          // @ts-ignore - TypeScript SDK might not have updated types yet
          "type": "web_search_20250305",
          "name": "web_search",
          "max_uses": maxWebSearches
        }
      ],
      betas: ["web-search-2025-03-05"]
    });

    console.log("Claude API response received");

    // Extract the explanation from the response
    const explanation = msg.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    return {
      success: true,
      explanation
    };
  } catch (error: any) {
    console.error("Error during AI explanation:", error);

    // Determine error type
    let errorType: ExplanationResult['errorType'] = 'UNKNOWN';
    let errorMessage = 'An unexpected error occurred';

    if (error.status === 401 || error.message?.includes('authentication')) {
      errorType = 'AUTH';
      errorMessage = 'Invalid API key. Please check your Claude API key in the Snap settings.';
    } else if (error.status === 429) {
      errorType = 'RATE_LIMIT';
      errorMessage = 'Rate limit exceeded. Please try again later.';
    } else if (error.message?.includes('network')) {
      errorType = 'NETWORK';
      errorMessage = 'Network error. Please check your connection.';
    }

    return {
      success: false,
      error: errorMessage,
      errorType
    };
  }
}

// Helper function to check if API key is configured
export async function isApiKeyConfigured(): Promise<boolean> {
  const state = await snap.request({
    method: "snap_manageState",
    params: { operation: "get" },
  });

  return !!state?.claudeApiKey;
}

// Helper function to check if auto-explain is enabled
export async function isAutoExplainEnabled(): Promise<boolean> {
  const state = await snap.request({
    method: "snap_manageState",
    params: { operation: "get" },
  });

  return (state?.autoExplain as boolean) ?? true; // Default to true
}