# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with hot reload (runs on http://localhost:5173)
- `npm run build` - Build for production (outputs to `build/` directory)
- `npm start` - Start production server
- `npm run typecheck` - Run TypeScript type checking

## Architecture Overview

This is a React Router v7 SPA application for smart contract verification using the Sourcify service. The app operates in SPA mode (SSR disabled in react-router.config.ts).

### Key Directories

- `app/` - Main application code
  - `components/` - Reusable UI components, with verification-specific components in `verification/`
  - `contexts/` - React contexts for global state (ServerConfig, CompilerVersions, Chains)
  - `hooks/` - Custom React hooks for form validation and verification state
  - `routes/` - Route components (home page, job status)
  - `types/` - TypeScript type definitions
  - `utils/` - Utility functions for API calls, storage, and business logic

### Core Architecture

**Verification Flow**: The app supports multiple verification methods (single-file, multiple-files, std-json, metadata-json, build-info) for both Solidity and Vyper contracts. Framework helpers (hardhat, foundry) provide setup instructions and can optionally use build-info file uploads. All methods eventually convert to standard JSON format before submission to Sourcify's v2 API.

**API Integration**: 
- `sourcifyApi.ts` - Main Sourcify API client with custom headers for client identification
- `etherscanApi.ts` - Etherscan integration for importing contract data
- All API calls use custom `sourcifyFetch()` with client identification headers

**State Management**: Uses React Context for global state:
- `ServerConfigContext` - Manages Sourcify server URLs (default, custom, localStorage sync)
- `CompilerVersionsContext` - Fetches and caches compiler versions
- `ChainsContext` - Manages blockchain network data

**Job Tracking**: Verification jobs are tracked via localStorage and polling the `/v2/verify/{verificationId}` endpoint.

### Environment Variables

- `VITE_SOURCIFY_SERVER_URL` - Default Sourcify server URL
- `VITE_SOURCIFY_REPO_URL` - Sourcify repository URL
- `VITE_GIT_COMMIT` - Git commit hash for client version tracking
- `VITE_ENV` - Environment (development/production)

### Build Configuration

- React Router v7 with Vite
- TailwindCSS v4 for styling
- TypeScript with strict mode
- Path alias: `~/*` maps to `./app/*`
- Web Workers used for bytecode diff calculations (`public/diffWorker.js`)

### Key Features Implemented

**Build-Info File Support**: Framework helpers (Hardhat/Foundry) can toggle between showing setup commands or uploading build-info files. The build-info feature:
- Parses Hardhat and Foundry build-info JSON files
- Extracts standard JSON compilation input from the "input" field
- Auto-populates compiler version from build-info metadata
- Validates build-info structure and provides helpful error messages
- Integrates seamlessly with existing std-json submission flow

**Type Safety**: Strong TypeScript typing throughout:
- `SelectedMethod` union type combines verification methods and framework methods
- Proper typing for all form validation and state management
- Type-safe API interfaces and response handling