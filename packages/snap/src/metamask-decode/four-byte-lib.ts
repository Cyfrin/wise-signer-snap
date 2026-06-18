import type { Hex } from '@metamask/utils';
import { isHexPrefixed } from 'ethereumjs-util';

import fetchWithCache from './fetch-with-cache';

type FourByteResult = {
  created_at: string;
  text_signature: string;
};

type FourByteResponse = {
  results: FourByteResult[];
};

/**
 *
 * @param fourBytePrefix
 */
export async function getMethodFrom4Byte(
  fourBytePrefix: string,
): Promise<string | undefined> {
  const hasTxData = Boolean((fourBytePrefix as Hex).toLowerCase?.() !== '0x');
  if (!hasTxData || stripHexPrefix(fourBytePrefix)?.length < 8) {
    return undefined;
  }

  const fourByteResponse = (await fetchWithCache({
    url: `https://www.4byte.directory/api/v1/signatures/?hex_signature=${fourBytePrefix}`,
    fetchOptions: {
      referrerPolicy: 'no-referrer-when-downgrade',
      body: null,
      method: 'GET',
      mode: 'cors',
    },
    functionName: 'getMethodFrom4Byte',
  })) as FourByteResponse;

  if (!fourByteResponse.results?.length) {
    return undefined;
  }

  fourByteResponse.results.sort((a, b) => {
    return new Date(a.created_at).getTime() < new Date(b.created_at).getTime()
      ? -1
      : 1;
  });

  return fourByteResponse.results[0]!.text_signature;
}

/**
 *
 * @param str
 */
export function stripHexPrefix(str: string) {
  if (typeof str !== 'string') {
    return str;
  }
  return isHexPrefixed(str) ? str.slice(2) : str;
}
