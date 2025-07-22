# Sourcify Verification UI

A modern, user-friendly web interface for verifying smart contracts with [Sourcify](https://sourcify.dev/). This application provides an intuitive way to verify Solidity and Vyper smart contracts by uploading source code and comparing it against deployed bytecode on various blockchain networks.

## Features

### Contract Verification

- **Multiple Verification Methods**: Support for single-file, multiple-files, standard JSON, and metadata.json verification
- **Language Support**: Solidity and Vyper with multiple compiler versions
- **Bytecode Comparison**: Visual diff tool with Web Workers for performance

### Smart Contract Discovery

- **Cross-chain Lookup**: Automatically check if contracts are verified on other networks
- **Verification Status**: Real-time display of verification status with match badges
- **Repository Links**: Direct links to verified contracts in the Sourcify repository

### Job Management

- **Job Tracking**: Monitor verification job progress with real-time status updates
- **Recent Verifications**: View and manage your recent verification attempts
- **Detailed Results**: Comprehensive error reporting and bytecode analysis

### Configuration

- **Server Settings**: Configure custom Sourcify server URLs

## Getting Started

### Prerequisites

- Node.js (version 20 or higher recommended)
- npm or yarn package manager

### Installation

1. Clone the repository:

```bash
git clone https://github.com/sourcifyeth/verify.sourcify.dev.git
cd verify.sourcify.dev
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (optional):

```bash
# Create .env file with custom server URLs
VITE_SOURCIFY_SERVER_URL=https://sourcify.dev/server
VITE_SOURCIFY_REPO_URL=https://repo.sourcify.dev
VITE_ENV=development
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is busy).

### Building

Build the application for production:

```bash
npm run build
```

This creates optimized production files in the `build/` directory.

### Production Deployment

Start the production server:

```bash
npm start
```

### Type Checking

Run TypeScript type checking:

```bash
npm run typecheck
```
