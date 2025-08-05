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

**Verification Flow**: The app supports multiple verification methods (single-file, multiple-files, std-json, metadata-json) for both Solidity and Vyper contracts. All methods eventually convert to standard JSON format before submission to Sourcify's v2 API.

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