import { AbiCoder } from 'ethers';

import type { Transaction, FourByteResponse, DecodedResult } from './types';

// Extract function signature from 4byte.directory response and try to decode with each one
/**
 *
 * @param selector
 * @param encodedParams
 */
async function getFunctionSignatureAndDecode(
  selector: string,
  encodedParams: string,
): Promise<{
  signature: string;
  inputs: string[];
  decodedInputs: any[];
} | null> {
  // Remove 0x prefix if present and ensure it's 8 characters (4 bytes)
  const cleanSelector = selector.replace('0x', '').slice(0, 8);

  const url = `https://www.4byte.directory/api/v1/signatures/?hex_signature=0x${cleanSelector}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: FourByteResponse = await response.json();

  if (!data.results || data.results.length === 0) {
    return null;
  }

  const abiCoder = AbiCoder.defaultAbiCoder();

  // Try each signature until we find one that decodes successfully
  for (const result of data.results) {
    const { inputs } = parseFunctionSignature(result.text_signature);

    // Skip if no parameters but we have encoded data
    if (inputs.length === 0 && encodedParams !== '0x') {
      continue;
    }

    // Skip if we expect parameters but have no encoded data
    if (inputs.length > 0 && encodedParams === '0x') {
      continue;
    }

    let decodedInputs: any[] = [];

    if (inputs.length > 0) {
      decodedInputs = abiCoder.decode(inputs, encodedParams);
    }

    // If we got here without throwing, this signature worked!
    return {
      signature: result.text_signature,
      inputs,
      decodedInputs: Array.from(decodedInputs),
    };
  }

  // None of the signatures worked
  return null;
}

/**
 *
 * @param signature
 */
function parseFunctionSignature(signature: string): {
  name: string;
  inputs: string[];
} {
  const match = signature.match(/^(\w+)\((.*)\)$/);
  if (!match) {
    throw new Error(`Invalid function signature: ${signature}`);
  }

  const [, name, paramsStr] = match;
  if (!name) {
    throw new Error(
      `Function name could not be parsed from signature: ${signature}`,
    );
  }
  const inputs = paramsStr
    ? paramsStr.split(',').map((param) => param.trim())
    : [];

  return { name, inputs };
}

// Recursively decode any bytes parameters that might contain nested function calls
/**
 *
 * @param decodedInputs
 * @param inputTypes
 */
async function decodeNestedBytes(
  decodedInputs: any[],
  inputTypes: string[],
): Promise<DecodedResult[]> {
  const nestedResults: DecodedResult[] = [];

  for (let i = 0; i < decodedInputs.length; i++) {
    const input = decodedInputs[i];
    const inputType = inputTypes[i];

    // Check if this is a bytes type that might contain encoded function call data
    if (
      inputType === 'bytes' &&
      typeof input === 'string' &&
      input.length >= 10
    ) {
      // Try to decode this as potential function call data
      const nestedResult = await decode({ data: input } as Transaction);
      if (nestedResult.function) {
        nestedResults.push(nestedResult);
      }
    }

    // Handle arrays of bytes
    if (inputType!.includes('bytes[]') && Array.isArray(input)) {
      for (const bytesItem of input) {
        if (typeof bytesItem === 'string' && bytesItem.length >= 10) {
          const nestedResult = await decode({ data: bytesItem } as Transaction);
          if (nestedResult.function) {
            nestedResults.push(nestedResult);
          }
        }
      }
    }
  }

  return nestedResults;
}

// Main decode function
/**
 *
 * @param transaction
 */
export async function decode(transaction: Transaction): Promise<DecodedResult> {
  if (!transaction.data || transaction.data.length < 10) {
    return {
      originalData: transaction.data || '',
      error: 'No data or data too short to contain function selector',
    };
  }

  // Extract function selector (first 4 bytes)
  const selector = transaction.data.slice(0, 10); // 0x + 8 hex chars
  const encodedParams = `0x${transaction.data.slice(10)}`; // Remove function selector

  // Get function signature and try to decode with it
  const decodingResult = await getFunctionSignatureAndDecode(
    selector,
    encodedParams,
  );

  if (!decodingResult) {
    return {
      originalData: transaction.data,
      error: `Unknown function selector or failed to decode: ${selector}`,
    };
  }

  const { signature, inputs, decodedInputs } = decodingResult;
  const { name } = parseFunctionSignature(signature);

  // Recursively decode any nested bytes parameters
  const nestedDecoding = await decodeNestedBytes(decodedInputs, inputs);

  const result: DecodedResult = {
    originalData: transaction.data,
    function: {
      selector,
      signature,
      name,
      inputs,
      decodedInputs,
    },
  };

  if (nestedDecoding.length > 0) {
    result.nestedDecoding = nestedDecoding;
  }

  return result;
}
