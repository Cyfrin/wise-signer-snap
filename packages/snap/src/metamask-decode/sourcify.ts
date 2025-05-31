import { FunctionFragment, Interface, ParamType } from '@ethersproject/abi';
import { Hex, createProjectLogger } from '@metamask/utils';
import {
  DecodedTransactionDataMethod,
  DecodedTransactionDataParam,
} from './transaction-decode';

const log = createProjectLogger('sourcify');

export type SourcifyResponse = {
  files: {
    name: string;
    content: string;
  }[];
};

export type SourcifyMetadata = {
  output: {
    abi: {
      inputs: { name: string; type: string }[];
    }[];
    devdoc?: {
      methods: {
        [signature: string]: {
          details?: string;
          params?: { [name: string]: string };
        };
      };
    };
    userdoc?: {
      methods: {
        [signature: string]: {
          notice?: string;
          params?: { [name: string]: string };
        };
      };
    };
  };
};

export async function decodeTransactionDataWithSourcify(
  transactionData: Hex,
  contractAddress: Hex,
  chainId: Hex,
): Promise<DecodedTransactionDataMethod | undefined> {
  try {
    log('Attempting to decode with Sourcify', {
      contractAddress,
      chainId,
      transactionData: transactionData.slice(0, 10), // Just log the function selector
    });

    const metadata = await fetchSourcifyMetadata(contractAddress, chainId);

    if (!metadata?.output?.abi) {
      log('No ABI found in Sourcify metadata', { contractAddress, chainId });
      return undefined;
    }

    log('Retrieved Sourcify metadata', {
      contractAddress,
      chainId,
      abiLength: metadata.output.abi.length,
    });

    const { abi } = metadata.output;
    const contractInterface = new Interface(abi);
    const functionSignature = transactionData.slice(0, 10);

    let functionData: FunctionFragment | undefined;

    try {
      functionData = contractInterface.getFunction(functionSignature);
    } catch (e) {
      log('Function not found in ABI', { functionSignature, error: e });
      return undefined;
    }

    if (!functionData) {
      log('Failed to find function in ABI', { functionSignature });
      return undefined;
    }

    const { name, inputs } = functionData;
    const signature = buildSignature(name, inputs);
    const userDoc = metadata.output.userdoc?.methods[signature];
    const devDoc = metadata.output.devdoc?.methods[signature];
    const description = userDoc?.notice ?? devDoc?.details;

    log('Extracted NatSpec', { signature, hasUserDoc: !!userDoc, hasDevDoc: !!devDoc });

    let values: any[];
    try {
      values = contractInterface.decodeFunctionData(
        functionSignature,
        transactionData,
      ) as any[];
    } catch (e) {
      log('Failed to decode function data', { functionSignature, error: e });
      return undefined;
    }

    const params = inputs.map((input, index) =>
      decodeParam(input, index, values, userDoc, devDoc),
    );

    const result: DecodedTransactionDataMethod = {
      name,
      params,
    };

    // Only add description if it exists
    if (description) {
      result.description = description;
    }

    return result;

  } catch (error) {
    log('Sourcify decoding failed', {
      contractAddress,
      chainId,
      error: error
    });
    return undefined;
  }
}

function decodeParam(
  input: ParamType,
  index: number,
  values: any[],
  userDoc: any,
  devDoc: any,
): DecodedTransactionDataParam {
  try {
    const { name: paramName, type, components } = input;

    const paramDescription =
      userDoc?.params?.[paramName] ?? devDoc?.params?.[paramName];

    const value = values[index];

    let children = components?.map((child, childIndex) =>
      decodeParam(child, childIndex, value, {}, {}),
    );

    if (type.endsWith('[]')) {
      const childType = type.slice(0, -2);

      if (Array.isArray(value)) {
        children = value.map((_arrayItem, arrayIndex) => {
          const childName = `Item ${arrayIndex + 1}`;

          return decodeParam(
            { ...input, name: childName, type: childType } as ParamType,
            arrayIndex,
            value,
            {},
            {},
          );
        });
      }
    }

    return {
      name: paramName,
      description: paramDescription,
      type,
      value,
      children,
    };
  } catch (error) {
    log('Failed to decode parameter', { input, index, error: error });
    return {
      name: input.name || `param_${index}`,
      type: input.type,
      value: 'Failed to decode',
    };
  }
}

async function fetchSourcifyMetadata(address: Hex, chainId: Hex): Promise<SourcifyMetadata | null> {
  try {
    const response = await fetchSourcifyFiles(address, chainId);

    if (!response?.files || response.files.length === 0) {
      log('No files found in Sourcify response', { address, chainId });
      return null;
    }

    const metadata = response.files.find((file) =>
      file.name.includes('metadata.json'),
    );

    if (!metadata) {
      log('Metadata file not found in Sourcify response', {
        address,
        chainId,
        availableFiles: response.files.map(f => f.name)
      });
      return null;
    }

    return JSON.parse(metadata.content) as SourcifyMetadata;
  } catch (error) {
    log('Failed to fetch Sourcify metadata', {
      address,
      chainId,
      error: error
    });
    return null;
  }
}

async function fetchSourcifyFiles(
  address: Hex,
  chainId: Hex,
): Promise<SourcifyResponse | null> {
  try {
    const chainIdDecimal = parseInt(chainId, 16);
    const url = `https://sourcify.dev/server/files/any/${chainIdDecimal}/${address}`;

    log('Fetching from Sourcify', { url });

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        log('Contract not found in Sourcify', { address, chainId, chainIdDecimal });
      } else {
        log('Sourcify API error', {
          address,
          chainId,
          status: response.status,
          statusText: response.statusText
        });
      }
      return null;
    }

    return await response.json();
  } catch (error) {
    log('Network error fetching from Sourcify', {
      address,
      chainId,
      error: error
    });
    return null;
  }
}

function buildSignature(name: string | undefined, inputs: ParamType[]): string {
  const types = inputs.map((input) =>
    input.components?.length
      ? `${buildSignature(undefined, input.components)}${input.type.endsWith('[]') ? '[]' : ''
      }`
      : input.type,
  );

  return `${name ?? ''}(${types.join(',')})`;
}