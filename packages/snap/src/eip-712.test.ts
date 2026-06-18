/**
 * ERC-8213 digest parity.
 *
 * The expected values are the spec's own vectors (the ERC-20 transfer and
 * empty-calldata Calldata Digests from the erc8213 reference, and the canonical
 * EIP-712 "Mail" example). A signer who computes the same digest with the
 * spec's tooling must get the same value, so these are pinned here.
 */

import {
  calculateCalldataDigest,
  calculateEIP712Hash,
  calculateSignatureHashes,
} from './eip-712';

describe('ERC-8213 calldata digest', () => {
  it('matches the spec ERC-20 transfer vector', () => {
    const data =
      '0xa9059cbb' +
      '0000000000000000000000004675c7e5baafbffbca748158becba61ef3b0a263' +
      '0000000000000000000000000000000000000000000000000de0b6b3a7640000';

    expect(calculateCalldataDigest(data)).toBe(
      '0x812cee5d9cc7461c04bbcd7b70af9c28b243ac5d74d3453b008b93b7dac69985',
    );
  });

  it('matches the empty-calldata vector (keccak256 of 32 zero bytes)', () => {
    expect(calculateCalldataDigest('0x')).toBe(
      '0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563',
    );
  });

  it('length prefix prevents shared-prefix collisions', () => {
    expect(calculateCalldataDigest('0xdeadbeef')).not.toBe(
      calculateCalldataDigest('0xdeadbeef00'),
    );
  });

  it('returns null for missing data', () => {
    expect(calculateCalldataDigest(undefined)).toBeNull();
  });
});

describe('ERC-8213 EIP-712 digests', () => {
  const mail = {
    domain: {
      name: 'Ether Mail',
      version: '1',
      chainId: 1,
      verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    },
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Person: [
        { name: 'name', type: 'string' },
        { name: 'wallet', type: 'address' },
      ],
      Mail: [
        { name: 'from', type: 'Person' },
        { name: 'to', type: 'Person' },
        { name: 'contents', type: 'string' },
      ],
    },
    primaryType: 'Mail',
    message: {
      from: {
        name: 'Cow',
        wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
      },
      to: { name: 'Bob', wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB' },
      contents: 'Hello, Bob!',
    },
  };

  it('matches the canonical EIP-712 Mail example', () => {
    const { domainHash, messageHash, eip712Digest } = calculateEIP712Hash(mail);

    expect(domainHash).toBe(
      '0xf2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090f',
    );
    expect(messageHash).toBe(
      '0xc52c0ee5d84264471806290a3f2c4cecfc5490626bf912d01f240d7a274b371e',
    );
    expect(eip712Digest).toBe(
      '0xbe609aee343fb3c4b28e1df9e632fca64fcfaede20f02e86244efddf30957bd2',
    );
  });
});

describe('signature hash routing', () => {
  it('routes typed-data to an eip712 result', () => {
    const result = calculateSignatureHashes({
      signatureMethod: 'eth_signTypedData_v4',
      data: {
        domain: { name: 'X', version: '1', chainId: 1 },
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
          ],
          Thing: [{ name: 'value', type: 'uint256' }],
        },
        primaryType: 'Thing',
        message: { value: 1 },
      },
    });

    expect(result.kind).toBe('eip712');
  });

  it('routes personal_sign to an eip191 result instead of throwing', () => {
    const result = calculateSignatureHashes({
      signatureMethod: 'personal_sign',
      data: '0x48656c6c6f',
    });

    expect(result.kind).toBe('eip191');
  });

  it('flags an unknown method as unsupported', () => {
    const result = calculateSignatureHashes({ signatureMethod: 'eth_weird' });

    expect(result).toStrictEqual({ kind: 'unsupported', method: 'eth_weird' });
  });
});
