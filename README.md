# CertChain

On-chain certificate issuance, collection, and verification — built on BOT Chain.

## What It Does

CertChain lets organizations issue tamper-proof certificates (hackathon completions, bootcamp credentials, workshop attendance, course diplomas) directly on the blockchain. Recipients collect certificates in their wallet, and anyone can verify authenticity with a certificate ID — no middlemen, no forgery.

### How It Works

1. **Organizer** connects their wallet and issues a certificate to a recipient's wallet address
2. **Recipient** connects their wallet to view all certificates linked to their address
3. **Anyone** can verify a certificate by entering its ID — no wallet required

### Why Blockchain?

- **Immutable** — once issued, certificates cannot be altered or deleted
- **Verifiable** — anyone can check authenticity on-chain without contacting the issuer
- **Permanent** — credentials live on the blockchain as long as the network exists
- **Trustless** — no need to trust a central authority; the smart contract enforces the rules

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Smart Contract | Solidity ^0.8.20 |
| Blockchain | BOT Chain (EVM-compatible) |
| Frontend | HTML, CSS, Vanilla JavaScript |
| Web3 | ethers.js v6 |
| Wallet | MetaMask |
| Hosting | GitHub Pages |

## Project Structure

```
blockchain-certificate-system/
├── contract/
│   └── CertChain.sol          # Solidity smart contract
├── css/
│   └── style.css               # Stylesheet
├── js/
│   └── app.js                  # Frontend logic + contract interaction
├── assets/                     # Logos and images
├── index.html                  # Main page
└── README.md                   # This file
```

## Smart Contract Functions

| Function | Access | Description |
|----------|--------|-------------|
| `issueCertificate()` | Owner only | Issue a new certificate to a recipient |
| `getCertificate()` | Public | Get certificate details by ID |
| `getWalletCertificates()` | Public | Get all certificate IDs for a wallet |
| `getTotalCertificates()` | Public | Get total certificates issued |

## Deployment

### Testnet (BOT Chain Testnet)

- **Network:** BOT Chain Testnet
- **Chain ID:** 968
- **RPC:** https://rpc.bohr.life
- **Explorer:** https://scan.bohr.life
- **Contract Address:** `[TO BE ADDED AFTER DEPLOYMENT]`

### Mainnet (BOT Chain Mainnet)

- **Network:** BOT Chain Mainnet
- **Chain ID:** 677
- **RPC:** https://rpc.botchain.ai
- **Explorer:** https://scan.botchain.ai
- **Contract Address:** `[TO BE ADDED AFTER DEPLOYMENT]`

## How to Use

### Connect Your Wallet

1. Install [MetaMask](https://metamask.io)
2. Visit the live site
3. Click "Connect Wallet"
4. Approve the connection and network switch in MetaMask

### Issue a Certificate (Admin)

1. Connect the owner wallet
2. Navigate to the "Issue" section (visible only to the owner)
3. Fill in: recipient address, name, event name, category
4. Click "Issue Certificate"
5. Confirm the transaction in MetaMask

### View Your Certificates

1. Connect your wallet
2. Scroll to "My Certificates"
3. All certificates linked to your address are displayed

### Verify a Certificate

1. Scroll to "Verify Certificate"
2. Enter the certificate ID
3. Click "Verify"
4. The certificate details are fetched directly from the blockchain

## License

MIT

## Links

- **Live Site:** [TO BE ADDED]
- **GitHub:** https://github.com/kvnlfrdzz/blockchain-certificate-system
- **X:** https://x.com/CertChainApp
- **BOT Chain:** https://botchain.ai
- **BOT Chain Explorer:** https://scan.botchain.ai
