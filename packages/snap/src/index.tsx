import type { OnTransactionHandler } from '@metamask/snaps-sdk';
import {
  Box,
  Heading,
  Text,
  Button,
  Divider,
  Spinner,
} from '@metamask/snaps-sdk/jsx';

import {
  explainTransaction,
  isAutoExplainEnabled,
  isApiKeyConfigured,
} from './ai-explainer';
import { Markdown } from './markdownFormatter';
import { decodeTransactionData } from './metamask-decode/util';
import { SnapProviderAdapter } from './snapProviderAdapter';

// Export handlers
export { onHomePage, onUserInput } from './homePage';

// Types for our decoded data structure
type DecodedParam = {
  name?: string;
  type?: string;
  value?: any;
  description?: string;
  children?: DecodedParam[];
  decodedBytes?: any;
};

type DecodedMethod = {
  name: string;
  description?: string;
  params: DecodedParam[];
};

type DecodedResult = {
  source: string;
  data: DecodedMethod[];
};

/**
 * Recursively attempts to decode bytes parameters
 *
 * @param param
 * @param chainId
 * @param providerAdapter
 * @param maxDepth
 */
async function recursivelyDecodeBytes(
  param: DecodedParam,
  chainId: string,
  providerAdapter: any,
  maxDepth: number = 3,
): Promise<DecodedParam> {
  if (maxDepth <= 0) {
    return param;
  }

  const shouldDecode =
    param.type?.includes('bytes') &&
    typeof param.value === 'string' &&
    param.value.startsWith('0x') &&
    param.value.length > 10;

  if (shouldDecode) {
    try {
      const decodedBytes = await decodeTransactionData({
        transactionData: param.value as `0x${string}`,
        contractAddress:
          '0x0000000000000000000000000000000000000000' as `0x${string}`,
        chainId: chainId as `0x${string}`,
        provider: providerAdapter,
      });

      if (decodedBytes && decodedBytes.data.length > 0) {
        const processedMethods = await Promise.all(
          decodedBytes.data.map(async (method) => ({
            ...method,
            params: await Promise.all(
              method.params.map(
                async (nestedParam) =>
                  await recursivelyDecodeBytes(
                    nestedParam,
                    chainId,
                    providerAdapter,
                    maxDepth - 1,
                  ),
              ),
            ),
          })),
        );

        param.decodedBytes = {
          ...decodedBytes,
          data: processedMethods,
        };
      }
    } catch (error) {
      // pass for now because metamask doesn't want console logging.
    }
  }

  if (param.children && param.children.length > 0) {
    param.children = await Promise.all(
      param.children.map(
        async (child) =>
          await recursivelyDecodeBytes(
            child,
            chainId,
            providerAdapter,
            maxDepth - 1,
          ),
      ),
    );
  }

  return param;
}

/**
 * Renders a parameter with its potential decoded bytes
 *
 * @param param
 * @param methodIndex
 * @param paramIndex
 * @param prefix
 */
function renderParam(
  param: DecodedParam,
  methodIndex: number,
  paramIndex: number,
  prefix: string = '',
): JSX.Element {
  const keyPrefix = `method-${methodIndex}-param-${paramIndex}${prefix}`;

  return (
    <Box key={keyPrefix}>
      <Text>
        {prefix}
        {param.name ? `${param.name}` : `Param ${paramIndex}`}
        {param.type ? ` (${param.type})` : ''}:{' '}
        {param.value ? String(param.value) : 'undefined'}
      </Text>

      {param.description ? (
        <Text>
          {prefix} └ {param.description}
        </Text>
      ) : null}

      {param.decodedBytes ? (
        <Box>
          <Text>{prefix} 🔍 Decoded bytes content:</Text>
          {param.decodedBytes.data.map(
            (decodedMethod: DecodedMethod, decodedMethodIndex: number) => (
              <Box key={`${keyPrefix}-decoded-${decodedMethodIndex}`}>
                <Text>
                  {prefix} 📋 Method: {decodedMethod.name}
                </Text>
                {decodedMethod.description ? (
                  <Text>
                    {prefix} └ {decodedMethod.description}
                  </Text>
                ) : null}

                {decodedMethod.params.map(
                  (decodedParam: DecodedParam, decodedParamIndex: number) =>
                    renderParam(
                      decodedParam,
                      methodIndex,
                      paramIndex + decodedParamIndex + 1000,
                      `${prefix}      `,
                    ),
                )}
              </Box>
            ),
          )}
        </Box>
      ) : null}

      {param.children && param.children.length > 0 ? (
        <Box>
          {param.children.map((child, childIndex) =>
            renderParam(
              child,
              methodIndex,
              paramIndex + childIndex + 100,
              `${prefix}  └ `,
            ),
          )}
        </Box>
      ) : null}
    </Box>
  );
}

export const onTransaction: OnTransactionHandler = async ({
  transaction,
  chainId,
  transactionOrigin,
}) => {
  // Check if auto-explain is enabled and API key is configured
  const autoExplainEnabled = await isAutoExplainEnabled();
  const hasApiKey = await isApiKeyConfigured();

  const providerAdapter = new SnapProviderAdapter(ethereum);

  // Decode the transaction data
  const decodedResult = await decodeTransactionData({
    transactionData: transaction.data as `0x${string}`,
    contractAddress: transaction.to as `0x${string}`,
    chainId: chainId as `0x${string}`,
    provider: providerAdapter as any,
  });

  if (!decodedResult) {
    return {
      content: (
        <Box>
          <Text>
            This transaction could not be decoded with available methods.
          </Text>
        </Box>
      ),
    };
  }

  // Process and decode bytes parameters
  const processedMethods = await Promise.all(
    decodedResult.data.map(async (method) => ({
      ...method,
      params: await Promise.all(
        method.params.map(
          async (param) =>
            await recursivelyDecodeBytes(param, chainId, providerAdapter),
        ),
      ),
    })),
  );

  const processedResult: DecodedResult = {
    ...decodedResult,
    data: processedMethods,
  };

  // Auto-explain is enabled - show loading state first
  if (autoExplainEnabled && hasApiKey) {
    // Create an interface with loading state
    const interfaceId = await snap.request({
      method: 'snap_createInterface',
      params: {
        ui: (
          <Box>
            <Heading>Analyzing Transaction...</Heading>
            <Spinner />
            <Text>Please wait while AI analyzes your transaction</Text>
          </Box>
        ),
      },
    });

    // Get AI explanation
    const aiResponse = await explainTransaction(
      JSON.stringify(processedResult),
      transaction.to || '',
      transaction.from || '',
      transaction.value || '0',
      chainId,
    );

    // Update the interface with the result
    if (aiResponse.success && aiResponse.explanation) {
      await snap.request({
        method: 'snap_updateInterface',
        params: {
          id: interfaceId,
          ui: (
            <Box>
              <Heading>AI Transaction Analysis</Heading>
              <Markdown>{aiResponse.explanation}</Markdown>
              <Divider />
              <Text color="muted">
                Source: {transactionOrigin || 'Unknown'}
              </Text>
            </Box>
          ),
        },
      });
    } else {
      // Show error with decoded data
      await snap.request({
        method: 'snap_updateInterface',
        params: {
          id: interfaceId,
          ui: (
            <Box>
              <Heading>Transaction Details</Heading>
              <Text color="error">
                AI Analysis Error: {aiResponse.error || 'Unknown error'}
              </Text>

              {aiResponse.errorType === 'NO_API_KEY' && (
                <Text color="warning">
                  Please configure your Claude API key in the Snap home page.
                </Text>
              )}

              <Text>From: {transactionOrigin || 'Unknown origin'}</Text>
              {decodedResult.data.map((method, methodIndex) => (
                <Box key={`method-${methodIndex}`}>
                  <Text>📋 Method: {method.name}</Text>
                  {method.description ? (
                    <Text> └ {method.description}</Text>
                  ) : null}
                  {method.params.map((param, paramIndex) =>
                    renderParam(param, methodIndex, paramIndex, '  '),
                  )}
                </Box>
              ))}
            </Box>
          ),
        },
      });
    }

    return {
      id: interfaceId,
    };
  }

  // If auto-explain is disabled but API key exists, create interactive interface
  if (!autoExplainEnabled && hasApiKey) {
    const interfaceId = await snap.request({
      method: 'snap_createInterface',
      params: {
        ui: (
          <Box>
            <Heading>Transaction Details</Heading>
            <Text>From: {transactionOrigin || 'Unknown origin'}</Text>
            {decodedResult.data.map((method, methodIndex) => (
              <Box key={`method-${methodIndex}`}>
                <Text>📋 Method: {method.name}</Text>
                {method.description ? (
                  <Text> └ {method.description}</Text>
                ) : null}
                {method.params.map((param, paramIndex) =>
                  renderParam(param, methodIndex, paramIndex, '  '),
                )}
              </Box>
            ))}
            <Divider />
            <Button name="ask-ai-analysis">
              🤖 Ask AI what this transaction does
            </Button>
          </Box>
        ),
        context: {
          processedResult: JSON.stringify(processedResult),
          to: transaction.to || '',
          from: transaction.from || '',
          value: transaction.value || '0',
          chainId,
          transactionOrigin: transactionOrigin || '',
        },
      },
    });

    return {
      id: interfaceId,
    };
  }

  // If no API key, show message
  if (!hasApiKey) {
    return {
      content: (
        <Box>
          <Heading>Transaction Details</Heading>
          <Text>From: {transactionOrigin || 'Unknown origin'}</Text>
          {decodedResult.data.map((method, methodIndex) => (
            <Box key={`method-${methodIndex}`}>
              <Text>📋 Method: {method.name}</Text>
              {method.description ? <Text> └ {method.description}</Text> : null}
              {method.params.map((param, paramIndex) =>
                renderParam(param, methodIndex, paramIndex, '  '),
              )}
            </Box>
          ))}
          <Divider />
          <Text color="warning">
            💡 Configure your Claude API key in the Snap home page to enable AI
            analysis
          </Text>
        </Box>
      ),
    };
  }

  // This should never be reached, but TypeScript needs a return
  return null;
};
