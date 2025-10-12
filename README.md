# EtherBlink

EtherBlink transforms blockchain actions into shareable links for receiving tips, selling items, and accepting payments on the Etherlink blockchain.

## 🚀 What It Does

EtherBlink allows creators and businesses to:
- **Receive Tips**: Generate shareable links for receiving cryptocurrency tips from your audience
- **Sell Items**: Create payment links for selling digital or physical items with secure transactions
- **Share Anywhere**: Share your blockchain action links on any platform - social media, websites, or messaging apps

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Blockchain**: Etherlink Testnet
- **Wallet Integration**: RainbowKit + Wagmi for seamless wallet connections
- **State Management**: React hooks with TanStack Query for data fetching

### Core Components

#### 1. **URL Shortening System**
```
https://etherblinks.vercel.app/a/{action-type}-{short-id}
```

**Examples:**
- `https://etherblinks.vercel.app/a/tip-jdahagecew` - Send a tip

**Features:**
- **Readable**: Action type is visible in the URL
- **Secure**: Short IDs are cryptographically random (12 characters)
- **No Data Loss**: Full blockchain data stored in database
- **Customizable**: Easy to add new action types


## 🔧 Technical Implementation

### 1. **Etherlink Integration**

#### Chain Configuration (`lib/wagmi.ts`)
```typescript
export const etherlinkTestnet: Chain = {
  id: 128123, // Etherlink Testnet Chain ID
  name: 'Etherlink Testnet',
  nativeCurrency: {
    name: 'Tezos',
    symbol: 'XTZ', // Native symbol is XTZ
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://node.ghostnet.etherlink.com'] },
  },
  blockExplorers: {
    default: { 
      name: 'Etherlink Testnet Explorer', 
      url: 'https://testnet.explorer.etherlink.com' 
    },
  },
  testnet: true,
};
```

#### Key Features:
- **EVM Compatibility**: Full Ethereum compatibility
- **Fast Transactions**: Sub-second finality
- **Low Fees**: Cost-effective transactions
- **Tezos Native**: Uses XTZ as native currency

### 2. **Action Types**

#### Tip Actions
- **Purpose**: Receive cryptocurrency tips
- **Parameters**: `recipient_address`, `tip_amount_eth`, `description`
- **Transaction**: Direct ETH transfer to recipient

#### NFT Sale Actions
- **Purpose**: Sell NFTs with instant payment
- **Parameters**: `contract_address`, `token_id`, `price`, `description`
- **Transaction**: Contract interaction with payment

### 3. **API Endpoints**

#### Create Action (`/api/create-action`)
```typescript
POST /api/create-action
{
  "action_type": "tip" | "nft_sale",
  "recipient_address": "0x...", // For tips
  "tip_amount_eth": "0.01", // For tips
  "contract_address": "0x...", // For NFT sales
  "token_id": "42", // For NFT sales
  "price": "1.5", // For NFT sales
  "description": "Optional description"
}
```

#### Execute Action (`/api/execute/[id]`)
- **GET**: Retrieve action metadata for frontend
- **POST**: Generate transaction object for wallet
- **PUT**: Legacy metadata endpoint for compatibility

### 4. **Frontend Architecture**

#### Page Structure
```
app/
├── page.tsx                 # Landing page with animations
├── create-link/
│   └── page.tsx            # Link creation form
├── a/[data]/
│   └── page.tsx            # Action execution page
├── api/
│   ├── create-action/
│   │   └── route.ts        # Action creation API
│   └── execute/[id]/
│       └── route.ts        # Action execution API
└── components/
    └── Header.tsx          # Navigation component
```

#### Key Features:
- **QR Code Generation**: Instant QR codes for sharing
- **Real-time Status**: Transaction status updates

### 5. **Wallet Integration**

#### RainbowKit Configuration
```typescript
// Custom dark theme
darkTheme({
  accentColor: '#38bdf8', // Cyan accent
  borderRadius: 'medium',
})
```

#### Supported Wallets:
- MetaMask
- WalletConnect

### 6. **Transaction Flow**

1. **Link Creation**: User fills form → API creates action → Returns short URL
2. **Link Sharing**: Short URL shared across platforms
3. **Link Execution**: User visits URL → Connects wallet → Confirms transaction
4. **Transaction**: Smart contract interaction or direct transfer
5. **Confirmation**: Real-time status updates and explorer links

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm
- WalletConnect project ID

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```

### Installation
```bash
# Clone repository
git clone https://github.com/devesh1011/EtherBlinks
cd EtherBlinks

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
```


## 🚀 Deployment

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
```bash
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_production_project_id
```

## 🔒 Security Features

- **Cryptographic Short IDs**: Random 12-character IDs for URL shortening
- **Input Validation**: Server-side validation for all user inputs
- **Rate Limiting**: API rate limiting to prevent abuse
- **HTTPS Only**: All production traffic over HTTPS

## 📱 Mobile Support

- **Responsive Design**: Works seamlessly on all device sizes
- **Touch Optimized**: Large touch targets and smooth interactions
- **PWA Ready**: Can be installed as a Progressive Web App
- **QR Code Sharing**: Easy mobile sharing via QR codes

## 🔄 Future Enhancements

- **Multi-chain Support**: Support for other EVM chains
- **Advanced NFT Features**: Batch sales, auctions, royalties
- **Analytics Dashboard**: Track link performance and earnings
- **Custom Domains**: White-label solutions for businesses
- **Webhook Integration**: Real-time notifications for transactions
- **Gas Optimization**: Smart gas estimation and optimization



**Built with ❤️ for the Etherlink ecosystem :)**
