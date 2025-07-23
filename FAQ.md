# Frequently Asked Questions (FAQ)

## General Questions

### What is the AI Transaction Explainer Snap?
The AI Transaction Explainer is a MetaMask Snap that uses Claude AI to analyze and explain blockchain transactions in plain English. Instead of seeing confusing hex data and contract calls, you get a clear explanation of what the transaction will do, potential risks, and important details to consider.

### How does it work?
When you're about to sign a transaction, the Snap:
1. Decodes the transaction data to understand what's being called
2. Sends this decoded information to Claude AI
3. Returns a human-readable explanation of what the transaction does
4. Highlights any potential risks or concerns

### Is it safe to use?
Yes! The Snap is designed with security in mind:
- Your API key is stored in MetaMask's encrypted storage
- The Snap only connects to Anthropic's official API
- All code is open source and auditable
- No transaction data is stored or logged
- You maintain full control over when AI analysis occurs

### Which networks does it support?
The Snap works with any EVM-compatible network that MetaMask supports, including:
- Ethereum Mainnet
- Polygon
- Arbitrum
- Optimism
- Base
- BSC
- And many more!

## Setup & Configuration

### How do I get a Claude API key?
1. Visit [Claude Console](https://console.anthropic.com/settings/workspaces/default/keys)
2. Sign up or log in to your Anthropic account
3. Click "Create Key"
4. Copy the key (it starts with `sk-ant-api...`)
5. Paste it into the Snap's settings

### Which Claude model should I choose?
- **Claude Opus 4**: Best for complex DeFi transactions, multi-step operations, and when accuracy is critical
- **Claude Sonnet 4**: Good balance of capability and speed for most transactions
- **Claude Sonnet 3.7**: Fastest option, great for simple transfers and common operations

### What is Auto-Explain mode?
- **Enabled**: Transactions are automatically analyzed when they appear
- **Disabled**: You'll see an "Ask AI" button to manually trigger analysis

Choose based on your preference for speed vs. control.

### Can I change my API key later?
Yes! You can update or remove your API key at any time from the Snap's home page in MetaMask.

## Usage

### Why is the AI explanation taking so long?
Analysis typically takes 2-5 seconds, but can be longer for:
- Complex multi-call transactions
- First-time contract interactions (web search for contract info)
- Using Opus model (more thorough but slower)
- High API traffic times

### What does "Transaction could not be decoded" mean?
This happens when:
- The contract doesn't have a verified ABI
- The transaction uses a proxy pattern we can't decode
- The data is encrypted or obfuscated

You'll still see the raw transaction details but without AI analysis.

### Can the AI see my wallet balance or private keys?
No! The Snap only has access to:
- The specific transaction you're about to sign
- Public blockchain data
- Your Claude API key (stored encrypted)

It cannot access your private keys, seed phrase, or wallet balances.

### What information does the AI analyze?
The AI examines:
- Contract addresses and their reputation
- Method being called and parameters
- Token amounts and recipients
- Potential risks (unlimited approvals, suspicious addresses, etc.)
- Cross-references with known protocols and exploits

## Troubleshooting

### "Invalid API key" error
- Double-check your API key is copied correctly
- Ensure your Anthropic account is active
- Verify you have API credits available
- Try generating a new key

### "Rate limit exceeded" error
Claude API has rate limits. If you hit them:
- Wait a few minutes and try again
- Consider upgrading your Anthropic plan
- Use a faster model (Sonnet 3.7) for routine transactions

### The Snap isn't appearing on transactions
Make sure:
- The Snap is properly installed and enabled
- You're using MetaMask Flask (not regular MetaMask)
- Auto-Explain is enabled OR click "Ask AI" button
- You have an API key configured

### Analysis seems incorrect or confusing
- The AI might struggle with very new or obscure protocols
- Try using Opus model for better analysis
- Report specific issues on our GitHub
- Remember: AI analysis is assistance, not financial advice

## Privacy & Security

### Is my transaction data private?
Yes! Transaction data is:
- Sent directly to Anthropic's API over HTTPS
- Not stored or logged by the Snap
- Not used for AI training (per Anthropic's API policies)
- Only analyzed when you explicitly allow it

### Can I verify what data is being sent?
Absolutely! The Snap is open source. You can:
- Review the code on GitHub
- See exactly what's sent to the AI
- Build and install your own version
- Contribute improvements

### What happens if my API key is compromised?
If you suspect your API key is compromised:
1. Go to [Claude Console](https://console.anthropic.com)
2. Revoke the compromised key immediately
3. Generate a new key
4. Update it in the Snap settings

## Costs & Limits

### How much does it cost?
The Snap itself is free! You only pay for:
- Claude API usage (typically $0.01-0.05 per transaction analysis)
- Check current pricing at [Anthropic's pricing page](https://www.anthropic.com/pricing)

### Are there usage limits?
Limits depend on your Anthropic account:
- Free tier: Limited requests per minute
- Paid tiers: Higher rate limits
- The Snap adds no additional limits

### Can I use this commercially?
Yes! The Snap is MIT licensed. You can:
- Use it for commercial purposes
- Modify it for your needs
- Integrate it into your products
- Just keep the attribution

## Advanced Features

### What are "decoded bytes"?
Some transactions contain nested data (like multicalls). The Snap recursively decodes these to show:
- Each individual call within a batch
- Nested contract interactions
- Complete operation flow

### Can it detect scams?
While not a dedicated scam detector, the AI will flag:
- Unusual approval amounts
- Transfers to fresh addresses
- Similarity to known attack patterns
- Suspicious contract behaviors

Always verify important transactions yourself!

### Does it work with hardware wallets?
Yes! The Snap works with any wallet MetaMask supports, including:
- Ledger
- Trezor
- GridPlus
- Other hardware wallets

## Support & Development

### How can I report bugs?
Please report issues on our [GitHub Issues](https://github.com/your-username/ai-transaction-explainer-snap/issues) with:
- Transaction details (hash, network)
- Error messages
- Expected vs. actual behavior
- Model used

### Can I contribute?
Yes! We welcome:
- Bug fixes
- Feature additions
- Documentation improvements
- Translation help

See our [CONTRIBUTING.md](./CONTRIBUTING.md) guide.

### Where can I get help?
- GitHub Issues for bugs
- GitHub Discussions for questions
- Twitter [@yourtwitterhandle] for updates
- Email: support@yourdomain.com

### What's on the roadmap?
Planned features include:
- Support for more AI providers (OpenAI, local models)
- Transaction simulation integration
- Batch transaction analysis
- Custom warning rules
- Multi-language support

---

**Still have questions?** Open an issue on GitHub and we'll add it to this FAQ!