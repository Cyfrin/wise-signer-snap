import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
    // defaults to process.env["ANTHROPIC_API_KEY"]
    apiKey: process.env["CLAUDE_API_KEY"],
});

export async function explainTransaction(decodedTx: string, to: string, from: string, value: string, chainId: string) {
    const msg = await anthropic.beta.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 20000,
        temperature: 1,
        system: "You are a web3 defi and security expert being used as an agent inside a web3 browser wallet, like Metamask. Your task is to explain a decoded transaction into as short of an explainer as possible, while also making it very clear what the risks and effects are. We want to be especially nervous and careful, and consider that both the website we are interacting with could be malicious, or the contract is malicious.\n\nYou should:\n\n1. Get all the addresses, and search the web for each address to validate what they are. For example, the address `0x78e30497a3c7527d953c6B1E3541b021A98Ac43c` is the Aave protocol's address on the ZKsync network according to the Aave official documentation. While `0xEA6f30e360192bae715599E15e2F765B49E4da98` is the address of the person who exploited the cork protocol.\n\n2. Explain in a one or two-sentence explainer what's going on. Looking out for any issues or unintended side effects the user may not be aware of, using the user's network, address, etc, as added context.\n\n3. Be extra careful of address poisoning attacks, where an address looks similar to, but is not the same, as another address.\n\n4. Assume, most of the time, the user is self-interested. For example, they would want to do a swap on Uniswap to get a good deal, it wouldn't make sense for them to do a swap of $1,000 of USDC for $100 of ETH.\n\n5. The short explainer should be 100% factual. For example, you shouldn't generalize/round up like \"you are sending 500 NFTs\" when you are sending 497 NFTs.",
        messages: [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": `The following is the decoded transaction I am sending:\n\n ${decodedTx}\n\nHere are the transaction details:\n-  to: ${to}\n- address from (me): ${from}\n- value: ${value}\n- chainId: ${chainId}\n\nCan you please explain this?\n`
                    }
                ]
            }
        ],
        tools: [
            {
                "name": "web_search",
                "type": "web_search_20250305"
            }
        ],
        betas: ["web-search-2025-03-05"]
    });
    return msg
}