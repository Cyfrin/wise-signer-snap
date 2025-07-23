import type { Provider } from '@metamask/network-controller';
import type { Hex } from '@metamask/utils';
import { createProjectLogger } from '@metamask/utils';

import { decodeTransactionDataWithFourByte } from './four-byte';
import { getContractProxyAddress } from './proxy';
import { decodeTransactionDataWithSourcify } from './sourcify';
import { decodeUniswapRouterTransactionData } from './uniswap';

const log = createProjectLogger('transaction-decode');

export enum DecodedTransactionDataSource {
  Uniswap = 'Uniswap',
  Sourcify = 'Sourcify',
  FourByte = 'FourByte',
}

export type DecodedTransactionDataResponse = {
  data: DecodedTransactionDataMethod[];
  source: DecodedTransactionDataSource;
};

export type DecodedTransactionDataMethod = {
  name: string;
  description?: string;
  params: DecodedTransactionDataParam[];
};

export type DecodedTransactionDataParam = {
  name?: string;
  description?: string;
  type?: string;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973

  value?: any;
  children?: DecodedTransactionDataParam[];
};

/**
 *
 * @param options0
 * @param options0.transactionData
 * @param options0.contractAddress
 * @param options0.chainId
 * @param options0.provider
 */
export async function decodeTransactionData({
  transactionData,
  contractAddress,
  chainId,
  provider,
}: {
  transactionData: Hex;
  contractAddress: Hex;
  chainId: Hex;
  provider: Provider;
}): Promise<DecodedTransactionDataResponse | undefined> {
  log('Decoding transaction data', {
    transactionData,
    contractAddress,
    chainId,
  });

  const uniswapData = decodeUniswapRouterTransactionData({
    transactionData,
    contractAddress,
    chainId,
  });

  if (uniswapData) {
    log('Decoded with Uniswap commands', uniswapData);

    return {
      data: normalizeDecodedMethods(uniswapData),
      source: DecodedTransactionDataSource.Uniswap,
    };
  }

  const proxyAddress = await getContractProxyAddress(contractAddress, provider);

  if (proxyAddress) {
    log('Retrieved proxy implementation address', proxyAddress);
  }

  const address = proxyAddress ?? contractAddress;

  const sourcifyData = decodeTransactionDataWithSourcify(
    transactionData,
    address,
    chainId,
  );

  const fourByteData = decodeTransactionDataWithFourByte(transactionData);

  const [sourcifyResult, fourByteResult] = await Promise.allSettled([
    sourcifyData,
    fourByteData,
  ]);

  if (sourcifyResult.status === 'fulfilled' && sourcifyResult.value) {
    log('Decoded data with Sourcify', sourcifyResult.value);

    return {
      data: normalizeDecodedMethods([sourcifyResult.value]),
      source: DecodedTransactionDataSource.Sourcify,
    };
  }

  log('Failed to decode data with Sourcify', sourcifyResult);

  if (fourByteResult.status === 'fulfilled' && fourByteResult.value) {
    log('Decoded data with 4Byte', fourByteResult.value);

    return {
      data: normalizeDecodedMethods([fourByteResult.value]),
      source: DecodedTransactionDataSource.FourByte,
    };
  }

  log('Failed to decode data with 4Byte', fourByteResult);

  return undefined;
}

/**
 *
 * @param methods
 */
function normalizeDecodedMethods(
  methods: DecodedTransactionDataMethod[],
): DecodedTransactionDataMethod[] {
  return methods.map((method) => normalizeDecodedMethod(method));
}

/**
 *
 * @param method
 */
function normalizeDecodedMethod(
  method: DecodedTransactionDataMethod,
): DecodedTransactionDataMethod {
  return {
    ...method,
    params: method.params.map((param) => normalizeDecodedParam(param)),
  };
}

/**
 *
 * @param param
 */
function normalizeDecodedParam(
  param: DecodedTransactionDataParam,
): DecodedTransactionDataParam {
  const normalized: DecodedTransactionDataParam = {
    ...param,
    value: normalizeDecodedParamValue(param.value),
  };

  // Only add children property if it exists and is not undefined
  if (param.children) {
    normalized.children = param.children.map((child) =>
      normalizeDecodedParam(child),
    );
  }

  return normalized;
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973

/**
 *
 * @param value
 */
function normalizeDecodedParamValue(value: any): any {
  const hexValue = value._hex;

  if (hexValue) {
    return BigInt(hexValue).toString();
  }

  return value;
}
