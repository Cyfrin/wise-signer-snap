import { ethers } from 'ethers';

interface EIP712HashResult {
    domainHash: string;
    messageHash: string;
    eip712Digest: string;
}

export const calculateEIP712Hash = (eip712Data: any): EIP712HashResult => {
    try {
        const domain = eip712Data.domain;
        const types = { ...eip712Data.types };
        const message = eip712Data.message;
        const primaryType = eip712Data.primaryType;

        // Remove EIP712Domain from types as ethers handles it separately
        delete types.EIP712Domain;

        // Calculate domain hash
        const domainHash = ethers.TypedDataEncoder.hashDomain(domain);

        // Calculate message hash (struct hash of the message)
        const messageHash = ethers.TypedDataEncoder.hashStruct(primaryType, types, message);

        // Calculate EIP-712 digest (the final signing hash)
        const eip712Digest = ethers.TypedDataEncoder.hash(domain, types, message);

        return {
            domainHash,
            messageHash,
            eip712Digest
        };
    } catch (err) {
        throw new Error(`Failed to calculate EIP-712 hash: ${err}`);
    }
};