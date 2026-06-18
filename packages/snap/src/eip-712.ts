import { ethers } from 'ethers';

type EIP712HashResult = {
  domainHash: string;
  messageHash: string;
  eip712Digest: string;
};

export const calculateEIP712Hash = (eip712Data: any): EIP712HashResult => {
  try {
    const { domain } = eip712Data;
    const types = { ...eip712Data.types };
    const { message } = eip712Data;
    const { primaryType } = eip712Data;

    // Remove EIP712Domain from types as ethers handles it separately
    delete types.EIP712Domain;

    // Calculate domain hash
    const domainHash = ethers.TypedDataEncoder.hashDomain(domain);

    // Calculate message hash (struct hash of the message)
    const messageHash = ethers.TypedDataEncoder.hashStruct(
      primaryType,
      types,
      message,
    );

    // Calculate EIP-712 digest (the final signing hash)
    const eip712Digest = ethers.TypedDataEncoder.hash(domain, types, message);

    return {
      domainHash,
      messageHash,
      eip712Digest,
    };
  } catch (error) {
    throw new Error(`Failed to calculate EIP-712 hash: ${String(error)}`);
  }
};

/**
 * The verification hashes ERC-8213 asks wallets to display, normalized across
 * the different `signatureMethod`s MetaMask can hand us. Computing these lets a
 * signer confirm a single digest on a hardware device instead of eyeballing the
 * raw payload.
 */
export type SignatureHashResult =
  | {
      kind: 'eip712';
      domainHash: string;
      messageHash: string;
      eip712Digest: string;
      isSafe: boolean;
      primaryType?: string | undefined;
    }
  | { kind: 'eip191'; digest: string }
  | { kind: 'raw'; digest: string }
  | { kind: 'unsupported'; method?: string | undefined };

const TYPED_DATA_METHODS = new Set([
  'eth_signTypedData',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
]);

/**
 * Computes the ERC-8213 verification hash(es) for a signature request.
 *
 * Unlike `calculateEIP712Hash`, this never throws — an unrecognized or
 * malformed payload returns a `kind: 'unsupported'` result so the signature
 * insight handler always renders something instead of failing the whole
 * request (which would happen for e.g. `personal_sign`, whose data is not
 * typed-data).
 *
 * @param signature - The signature object from `onSignature`.
 * @param signature.signatureMethod - The signing RPC method (e.g. `personal_sign`, `eth_signTypedData_v4`).
 * @param signature.data - The payload to be signed.
 * @returns The hash result, discriminated by `kind`.
 */
export const calculateSignatureHashes = (signature: {
  signatureMethod?: string;
  data?: any;
}): SignatureHashResult => {
  const method = signature?.signatureMethod;
  const data = signature?.data;

  try {
    if (method && TYPED_DATA_METHODS.has(method)) {
      const typed = typeof data === 'string' ? JSON.parse(data) : data;
      const { domainHash, messageHash, eip712Digest } =
        calculateEIP712Hash(typed);
      const primaryType = typed?.primaryType as string | undefined;
      const isSafe =
        primaryType === 'SafeTx' ||
        primaryType === 'SafeMessage' ||
        Boolean(typed?.types?.SafeTx) ||
        Boolean(typed?.types?.SafeMessage);

      return {
        kind: 'eip712',
        domainHash,
        messageHash,
        eip712Digest,
        isSafe,
        primaryType,
      };
    }

    if (method === 'personal_sign') {
      // personal_sign data arrives hex-encoded; hash it as raw bytes so we
      // reproduce the EIP-191 digest the wallet will actually sign.
      const message =
        typeof data === 'string' && data.startsWith('0x')
          ? ethers.getBytes(data)
          : data;

      return { kind: 'eip191', digest: ethers.hashMessage(message) };
    }

    if (method === 'eth_sign') {
      const digest = typeof data === 'string' ? data : ethers.hexlify(data);

      return { kind: 'raw', digest };
    }

    return { kind: 'unsupported', method };
  } catch {
    return { kind: 'unsupported', method };
  }
};

/**
 * The ERC-8213 Calldata Digest — `keccak256( uint256(len(calldata)) ‖ calldata )`.
 *
 * The 32-byte big-endian length prefix is what distinguishes this from a plain
 * keccak256 of the data — it prevents shared-prefix collisions. chainId is
 * intentionally not mixed in, so the digest is reusable across networks. This
 * matches the ERC-8213 reference vectors so a signer can verify the same value
 * the spec's tooling computes.
 *
 * @param data - The calldata, hex-encoded. `'0x'` (no calldata) hashes the
 * empty byte string, per the spec.
 * @returns The 32-byte digest, or null when data is missing or malformed.
 */
export const calculateCalldataDigest = (data?: string): string | null => {
  if (data === undefined || data === null) {
    return null;
  }

  try {
    const bytes = ethers.getBytes(data);
    const lenWord = ethers.toBeHex(bytes.length, 32);
    return ethers.keccak256(ethers.concat([lenWord, bytes]));
  } catch {
    return null;
  }
};
