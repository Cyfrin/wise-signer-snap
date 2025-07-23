import Anthropic from '@anthropic-ai/sdk';
import { Message } from '@anthropic-ai/sdk/resources/messages';

export type ExplanationResult = {
  success: boolean;
  explanation?: string;
  error?: string;
  errorType?: 'NO_API_KEY' | 'AUTH' | 'RATE_LIMIT' | 'NETWORK' | 'UNKNOWN';
};

/**
 *
 * @param decodedTx
 * @param to
 * @param from
 * @param value
 * @param chainId
 */
export async function explainTransaction(
  decodedTx: string,
  to: string,
  from: string,
  value: string,
  chainId: string,
): Promise<ExplanationResult> {
  console.log('Transaction details:', { to, from, value, chainId });
  console.log('Decoded transaction:', decodedTx);

  try {
    // Get stored API key from snap state
    const state = await snap.request({
      method: 'snap_manageState',
      params: { operation: 'get' },
    });

    const apiKey = state?.claudeApiKey as string | undefined;
    const selectedModel =
      (state?.selectedModel as string) ?? 'claude-sonnet-4-20250514';

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

    console.log('Calling Claude API...');

    const msg = await anthropic.beta.messages.create({
      model: selectedModel,
      max_tokens: 20000,
      temperature: 1,
      system:
        "You are a web3 defi and security expert being used as an agent inside a web3 browser wallet, like Metamask. Your task is to explain a decoded transaction into as short of an explainer as possible, while also making it very clear what the risks and effects are. We want to be especially nervous and careful, and consider that both the website we are interacting with could be malicious, or the contract is malicious.\n\nYou should:\n\n1. Get all the addresses, and search the web for each address to validate what they are. For example, the address `0x78e30497a3c7527d953c6B1E3541b021A98Ac43c` is the Aave protocol's address on the ZKsync network according to the Aave official documentation. While `0xEA6f30e360192bae715599E15e2F765B49E4da98` is the address of the person who exploited the cork protocol.\n\n2. Explain in a one or two-sentence explainer what's going on. Looking out for any issues or unintended side effects the user may not be aware of, using the user's network, address, etc, as added context.\n\n3. Be extra careful of address poisoning attacks, where an address looks similar to, but is not the same, as another address.\n\n4. Assume, most of the time, the user is self-interested. For example, they would want to do a swap on Uniswap to get a good deal, it wouldn't make sense for them to do a swap of $1,000 of USDC for $100 of ETH.\n\n5. The short explainer should be 100% factual. For example, you shouldn't generalize/round up like \"you are sending 500 NFTs\" when you are sending 497 NFTs.",
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `The following is the decoded transaction I am sending:\n\n${decodedTx}\n\nHere are the transaction details:\n- to: ${to}\n- address from (me): ${from}\n- value: ${value}\n- chainId: ${chainId}\n\nCan you please explain this?`,
            },
          ],
        },
      ],
      tools: [
        {
          // @ts-ignore - TypeScript SDK might not have updated types yet
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 5,
        },
      ],
      betas: ['web-search-2025-03-05'],
    });

    console.log('Claude API response received');

    // Extract the explanation from the response
    const explanation = msg.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    return {
      success: true,
      explanation,
    };
  } catch (error: any) {
    console.error('Error during AI explanation:', error);

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

// Helper function to check if API key is configured
/**
 *
 */
export async function isApiKeyConfigured(): Promise<boolean> {
  const state = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  });

  return Boolean(state?.claudeApiKey);
}

// Helper function to check if auto-explain is enabled
/**
 *
 */
export async function isAutoExplainEnabled(): Promise<boolean> {
  const state = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  });

  return (state?.autoExplain as boolean) ?? true; // Default to true
}
