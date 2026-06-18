import Anthropic from '@anthropic-ai/sdk';

import {
  SYSTEM_PROMPT,
  generateMessagePrompt,
  DEFAULT_MAX_WEB_SEARCHES,
  DEFAULT_AUTO_EXPLAIN,
  resolveModel,
} from './constants';

export type ExplanationResult = {
  success: boolean;
  explanation?: string;
  error?: string;
  errorType?: 'NO_API_KEY' | 'AUTH' | 'RATE_LIMIT' | 'NETWORK' | 'UNKNOWN';
};

/**
 * Asks Claude to explain a decoded transaction in plain English.
 *
 * @param decodedTx - The decoded transaction data, serialized as JSON.
 * @param to - The transaction recipient address.
 * @param from - The sender (the user) address.
 * @param value - The native value being sent, in wei.
 * @param chainId - The EIP-155 chain id.
 * @returns The explanation, or a structured error result.
 */
export async function explainTransaction(
  decodedTx: string,
  to: string,
  from: string,
  value: string,
  chainId: string,
): Promise<ExplanationResult> {
  try {
    // Get stored API key from snap state
    const state = await snap.request({
      method: 'snap_manageState',
      params: { operation: 'get' },
    });

    const apiKey = state?.claudeApiKey as string | undefined;
    const selectedModel = resolveModel(state?.selectedModel);
    const maxWebSearches =
      (state?.maxWebSearches as number) ?? DEFAULT_MAX_WEB_SEARCHES;

    if (!apiKey) {
      return {
        success: false,
        error:
          'Claude API key not configured. Please set it on the Snap home page.',
        errorType: 'NO_API_KEY',
      };
    }

    const anthropic = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
    const generatedMessage = generateMessagePrompt(
      decodedTx,
      to,
      from,
      value,
      chainId,
    );

    const response = await anthropic.beta.messages.create({
      // 16k keeps non-streaming requests under the SDK HTTP timeout; explanations
      // are short. `temperature` is omitted because it 400s on Opus 4.7+/Fable 5.
      model: selectedModel,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: generatedMessage,
            },
          ],
        },
      ],
      tools: [
        {
          // @ts-ignore - TypeScript SDK might not have updated types yet
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: maxWebSearches,
        },
      ],
      betas: ['web-search-2025-03-05'],
    });

    // Safety classifiers can decline a request (HTTP 200, stop_reason "refusal").
    if (String(response.stop_reason) === 'refusal') {
      return {
        success: false,
        error: 'The model declined to analyze this transaction.',
        errorType: 'UNKNOWN',
      };
    }

    // Extract the explanation from the response
    const explanation = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    return {
      success: true,
      explanation,
    };
  } catch (error: any) {
    // Determine error type
    let errorType: ExplanationResult['errorType'] = 'UNKNOWN';
    let errorMessage = 'An unexpected error occurred';

    if (error.status === 401 || error.message?.includes('authentication')) {
      errorType = 'AUTH';
      errorMessage =
        'Invalid API key. Please check your Claude API key in the Snap settings.';
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
      errorType,
    };
  }
}

/**
 * Whether a Claude API key is currently stored.
 *
 * @returns True if a key is configured.
 */
export async function isApiKeyConfigured(): Promise<boolean> {
  const state = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  });

  return Boolean(state?.claudeApiKey);
}

/**
 * Whether auto-explain is enabled (defaults to off so analyses aren't billed
 * without an explicit opt-in).
 *
 * @returns True if auto-explain is on.
 */
export async function isAutoExplainEnabled(): Promise<boolean> {
  const state = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  });

  return (state?.autoExplain as boolean) ?? DEFAULT_AUTO_EXPLAIN;
}
