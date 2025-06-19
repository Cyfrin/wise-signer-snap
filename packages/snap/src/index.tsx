import type { OnTransactionHandler } from "@metamask/snaps-sdk";
import { Box, Heading, Text } from "@metamask/snaps-sdk/jsx";
import { decodeTransactionData } from "./metamask-decode/util";
import { SnapProviderAdapter } from "./snapProviderAdapter";
import { explainTransaction } from "./ai-explainer";

// Types for our decoded data structure
interface DecodedParam {
  name?: string;
  type?: string;
  value?: any; // Made optional to match DecodedTransactionDataParam
  description?: string;
  children?: DecodedParam[];
  decodedBytes?: any; // For recursively decoded bytes
}

interface DecodedMethod {
  name: string;
  description?: string;
  params: DecodedParam[];
}

interface DecodedResult {
  source: string;
  data: DecodedMethod[];
}

/**
 * Recursively attempts to decode bytes parameters
 */
async function recursivelyDecodeBytes(
  param: DecodedParam,
  chainId: string,
  providerAdapter: any,
  maxDepth: number = 3
): Promise<DecodedParam> {
  // Prevent infinite recursion
  if (maxDepth <= 0) {
    return param;
  }

  // Check if this parameter contains bytes data that we should try to decode
  const shouldDecode =
    param.type?.includes('bytes') &&
    typeof param.value === 'string' &&
    param.value.startsWith('0x') &&
    param.value.length > 10; // Must be more than just "0x" + a few chars

  if (shouldDecode) {
    try {
      // Attempt to decode the bytes as transaction data
      const decodedBytes = await decodeTransactionData({
        transactionData: param.value as `0x${string}`,
        contractAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`, // Use zero address when no specific contract
        chainId: chainId as `0x${string}`,
        provider: providerAdapter,
      });

      if (decodedBytes && decodedBytes.data.length > 0) {
        // Recursively process the decoded bytes parameters
        const processedMethods = await Promise.all(
          decodedBytes.data.map(async (method) => ({
            ...method,
            params: await Promise.all(
              method.params.map(async (nestedParam) =>
                await recursivelyDecodeBytes(nestedParam, chainId, providerAdapter, maxDepth - 1)
              )
            )
          }))
        );

        param.decodedBytes = {
          ...decodedBytes,
          data: processedMethods
        };
      }
    } catch (error) {
      // If decoding fails, that's okay - not all bytes are decodable transaction data
      console.log(`Failed to decode bytes parameter: ${error}`);
    }
  }

  // Recursively process children if they exist
  if (param.children && param.children.length > 0) {
    param.children = await Promise.all(
      param.children.map(async (child) =>
        await recursivelyDecodeBytes(child, chainId, providerAdapter, maxDepth - 1)
      )
    );
  }

  return param;
}

/**
 * Renders a parameter with its potential decoded bytes
 */
function renderParam(
  param: DecodedParam,
  methodIndex: number,
  paramIndex: number,
  prefix: string = ""
): JSX.Element {
  const keyPrefix = `method-${methodIndex}-param-${paramIndex}${prefix}`;

  return (
    <Box key={keyPrefix}>
      <Text>
        {prefix}{param.name ? `${param.name}` : `Param ${paramIndex}`}
        {param.type ? ` (${param.type})` : ''}: {param.value ? String(param.value) : 'undefined'}
      </Text>

      {param.description ? (
        <Text>{prefix}  └ {param.description}</Text>
      ) : null}

      {/* Show decoded bytes if available */}
      {param.decodedBytes ? (
        <Box>
          <Text>{prefix}  🔍 Decoded bytes content:</Text>
          {param.decodedBytes.data.map((decodedMethod: DecodedMethod, decodedMethodIndex: number) => (
            <Box key={`${keyPrefix}-decoded-${decodedMethodIndex}`}>
              <Text>{prefix}    📋 Method: {decodedMethod.name}</Text>
              {decodedMethod.description ? (
                <Text>{prefix}      └ {decodedMethod.description}</Text>
              ) : null}

              {decodedMethod.params.map((decodedParam: DecodedParam, decodedParamIndex: number) =>
                renderParam(
                  decodedParam,
                  methodIndex,
                  paramIndex + decodedParamIndex + 1000, // Offset to avoid key conflicts
                  prefix + "      "
                )
              )}
            </Box>
          ))}
        </Box>
      ) : null}

      {/* Show children if available */}
      {param.children && param.children.length > 0 ? (
        <Box>
          {param.children.map((child, childIndex) =>
            renderParam(
              child,
              methodIndex,
              paramIndex + childIndex + 100, // Offset to avoid key conflicts
              prefix + "  └ "
            )
          )}
        </Box>
      ) : null}
    </Box>
  );
}


// TODO: Dump the decoded data into an AI!!!!

// TODO: Either:
// TODO: To it's own server... Or... Let the user just use their own Anthropic API key...

export const onTransaction: OnTransactionHandler = async ({
  transaction,
  chainId,
  transactionOrigin,
}) => {
  console.log("WTF")
  // Create provider adapter
  const providerAdapter = new SnapProviderAdapter(ethereum);

  // Decode the transaction data using MetaMask's decoder
  const decodedResult = await decodeTransactionData({
    transactionData: transaction.data as `0x${string}`,
    contractAddress: transaction.to as `0x${string}`,
    chainId: chainId as `0x${string}`,
    provider: providerAdapter as any,
  });

  console.log("WTF2")


  // Recursively decode any bytes parameters
  let processedResult: DecodedResult | null = null;
  console.log(decodedResult)
  if (decodedResult) {
    const processedMethods = await Promise.all(
      decodedResult.data.map(async (method) => ({
        ...method,
        params: await Promise.all(
          method.params.map(async (param) =>
            await recursivelyDecodeBytes(param, chainId, providerAdapter)
          )
        )
      }))
    );

    processedResult = {
      ...decodedResult,
      data: processedMethods
    };

    const aiResponse = await explainTransaction(
      JSON.stringify(decodedResult),
      transaction.to,
      transaction.from,
      transaction.value,
      chainId
    );

    // Extract text content from the AI response
    const aiExplanation = aiResponse?.content?.[0]?.type === 'text'
      ? aiResponse.content[0].text
      : "Unable to generate AI explanation";

    console.log(aiExplanation)

    return {
      content: (
        <Box>
          <p>hi</p>
          <Text>{aiExplanation}</Text>
        </Box>
      ),
    };
  }

  console.log("WTF3")


  return {
    content: (
      <Box>
        <Text>To: {transaction.to}</Text>
        <Text>Value: {transaction.value}</Text>
        <Text>This transaction could not be decoded with available methods.</Text>
      </Box>
    ),
  };
};