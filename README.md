# The Cursed Hero: Fuzzy Survival

A dungeon exploration survival game built on Ethereum using Fully Homomorphic Encryption (FHEVM). Players navigate through encrypted game state where health points and potion counts remain hidden, making decisions based on vague textual feedback.

## Overview

The Cursed Hero: Fuzzy Survival challenges players to survive in a dungeon where their health and inventory are encrypted on-chain using FHEVM. Unlike traditional games that display exact values, players receive only ambiguous textual feedback about their condition—ranging from feeling energetic to experiencing blurred vision—forcing critical decisions under uncertainty.

## Features

- **Encrypted Game State**: Player HP and potion counts are stored as `euint8` encrypted values on-chain
- **Fuzzy Feedback System**: Players receive vague textual feedback instead of exact numbers
- **FHEVM Integration**: Leverages fully homomorphic encryption for on-chain encrypted computations
- **Dual Mode Support**: Works with both mock relayer (local development) and real relayer (testnet)
- **Wallet Integration**: EIP-6963 compatible wallet connection with persistent state

## Tech Stack

### Smart Contracts
- Solidity 0.8.24+
- FHEVM Solidity Library
- Hardhat for development and testing

### Frontend
- Next.js 15+ (Static Export)
- React 19+
- Ethers.js 6+
- TypeScript
- Tailwind CSS

## Project Structure

```
.
├── fhevm-hardhat-template/    # Smart contracts and deployment
│   ├── contracts/              # Solidity contracts
│   ├── deploy/                 # Deployment scripts
│   ├── test/                   # Contract tests
│   └── tasks/                  # Hardhat tasks
└── fuzzy-survival-frontend/    # Next.js frontend application
    ├── app/                    # Next.js app router pages
    ├── components/             # React components
    ├── hooks/                  # Custom React hooks
    ├── fhevm/                  # FHEVM integration logic
    └── abi/                    # Auto-generated contract ABIs
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Hardhat node (for local development)
- MetaMask or compatible wallet

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fuzzy-survival
   ```

2. **Install contract dependencies**
   ```bash
   cd fhevm-hardhat-template
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../fuzzy-survival-frontend
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cd ../fhevm-hardhat-template
   npx hardhat vars set MNEMONIC
   npx hardhat vars set INFURA_API_KEY
   ```

### Development

#### Local Development (Mock Mode)

1. **Start Hardhat node**
   ```bash
   cd fhevm-hardhat-template
   npx hardhat node
   ```

2. **Deploy contracts locally**
   ```bash
   npx hardhat deploy --network localhost
   ```

3. **Start frontend in mock mode**
   ```bash
   cd ../fuzzy-survival-frontend
   npm run dev:mock
   ```

#### Testnet Development

1. **Deploy contracts to Sepolia**
   ```bash
   cd fhevm-hardhat-template
   npx hardhat deploy --network sepolia
   ```

2. **Start frontend**
   ```bash
   cd ../fuzzy-survival-frontend
   npm run dev
   ```

## Contract Addresses

### Sepolia Testnet
- **FuzzySurvival**: `0x3597979fD6A54Fc15E5838ded9A28cC29B2fE653`
- **GameHistory**: `0x17622ae1076013BE7E00a56646Ca8f633d012c11`

## How It Works

1. **Game Initialization**: Players create encrypted game state with initial HP (100) and potions (3)
2. **Movement**: Each move consumes encrypted HP, with feedback calculated based on HP ranges
3. **Combat**: Players take encrypted damage, receiving fuzzy feedback about their condition
4. **Potions**: Limited potions can be used to restore HP, requiring encrypted comparisons
5. **Victory Conditions**: Reach target depth or explore enough rooms to win

## FHEVM Features Used

- `euint8`: Encrypted unsigned 8-bit integers for HP and potion counts
- `FHE.add()`: Encrypted addition for healing
- `FHE.sub()`: Encrypted subtraction for damage
- `FHE.gt()`: Encrypted comparison for checking potion availability
- `FHE.select()`: Conditional selection based on encrypted comparisons
- `FHE.fromExternal()`: Converting external encrypted values to contract format
- `FHE.allow()` / `FHE.allowThis()`: Granting decryption permissions

## Testing

### Contract Tests
```bash
cd fhevm-hardhat-template
npx hardhat test
```

### Frontend Static Export Check
```bash
cd fuzzy-survival-frontend
npm run check:static
```

## Building

### Frontend Production Build
```bash
cd fuzzy-survival-frontend
npm run build
```

The build output will be in the `out/` directory, ready for static hosting.

## Deployment

The frontend is configured for static export and can be deployed to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- Any static file server

## License

MIT

## Acknowledgments

Built using [FHEVM](https://docs.zama.ai/protocol) by Zama for fully homomorphic encryption on Ethereum.

