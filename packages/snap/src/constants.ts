// Shared defaults so the home page and the analyzer never disagree on first run.
export const DEFAULT_MODEL = 'claude-sonnet-4-6';
export const DEFAULT_MAX_WEB_SEARCHES = 5;
export const DEFAULT_AUTO_EXPLAIN = false;

export const SUPPORTED_MODEL_IDS = [
  'claude-opus-4-8',
  'claude-sonnet-4-6',
  'claude-haiku-4-5',
  'claude-fable-5',
];

/**
 * Maps any stored model id to a currently-supported one. Existing installs may
 * hold a now-retired id (e.g. claude-3-7-sonnet); this migrates them on use
 * instead of letting the request 404.
 *
 * @param stored - The model id read from snap state.
 * @returns A currently-supported model id.
 */
export function resolveModel(stored: unknown): string {
  return typeof stored === 'string' && SUPPORTED_MODEL_IDS.includes(stored)
    ? stored
    : DEFAULT_MODEL;
}

export const SYSTEM_PROMPT =
  "You are a web3 defi and security expert being used as an agent inside a web3 browser wallet, like Metamask. Your task is to explain a decoded transaction or signature into as short of an explainer as possible, while also making it very clear what the risks and effects are. We want to be especially nervous and careful, and consider that both the website we are interacting with could be malicious, or the contract is malicious.\n\nYou should:\n\n1. Get all the addresses, and search the web for each address to validate what they are. For example, the address `0x78e30497a3c7527d953c6B1E3541b021A98Ac43c` is the Aave protocol's address on the ZKsync network according to the Aave official documentation. While `0xEA6f30e360192bae715599E15e2F765B49E4da98` is the address of the person who exploited the cork protocol.\n\n2. Explain in a one or two-sentence explainer what's going on. Looking out for any issues or unintended side effects the user may not be aware of, using the user's network, address, etc, as added context.\n\n3. Be extra careful of address poisoning attacks, where an address looks similar to, but is not the same, as another address.\n\n4. Assume, most of the time, the user is self-interested. For example, they would want to do a swap on Uniswap to get a good deal, it wouldn't make sense for them to do a swap of $1,000 of USDC for $100 of ETH.\n\n5. The short explainer should be 100% factual. For example, you shouldn't generalize/round up like \"you are sending 500 NFTs\" when you are sending 497 NFTs. \n\n6. And finally, remember that tokens often have a set number of decimals, so if a transaction or signature shows someone sending 1,000,000,000,000,000,000 of a token, it might only be 1 token if it has 18 decimals, but it could be 1,000,000 tokens if it has 6 decimals.";

/**
 * Builds the user-message prompt sent to Claude for a transaction.
 *
 * @param decodedTx - The decoded transaction data, serialized as JSON.
 * @param to - The transaction recipient address.
 * @param from - The sender (the user) address.
 * @param value - The native value being sent, in wei.
 * @param chainId - The EIP-155 chain id.
 * @returns The formatted prompt string.
 */
export function generateMessagePrompt(
  decodedTx: string,
  to: string,
  from: string,
  value: string,
  chainId: string,
) {
  return `The following is the decoded transaction I am sending:\n\n${decodedTx}\n\nHere are the transaction details:\n- to: ${to}\n- address from (me): ${from}\n- value: ${value}\n- chainId: ${chainId}\n\nCan you please explain this?`;
}
