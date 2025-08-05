export type Language = "solidity" | "vyper";

// Verification method IDs
export type VerificationMethod = "single-file" | "multiple-files" | "std-json" | "metadata-json" | "build-info";

// Framework method IDs
export type FrameworkVerificationMethod = "hardhat" | "foundry";

// Method objects with full details
export interface VerificationMethodObject {
  id: VerificationMethod;
  title: string;
  description: string;
  warning?: React.ReactNode;
}

export interface FrameworkMethodObject {
  id: FrameworkVerificationMethod;
  title: string;
  description: string;
  icon: string;
}

export interface VerificationMethods {
  solidity: VerificationMethodObject[];
  vyper: VerificationMethodObject[];
}

export interface FrameworkMessages {
  [key: string]: () => React.ReactNode;
}

export interface BuildInfoParseResult {
  isValid: boolean;
  error?: string;
  standardJson?: any;
  compilerVersion?: string;
}

export interface VerifiedContractMinimal {
  match: string;
  creationMatch: string;
  runtimeMatch: string;
  chainId: string;
  address: string;
  verifiedAt: string;
  matchId: string;
}

export interface AllChainsResponse {
  results: VerifiedContractMinimal[];
}

export interface SubmissionResult {
  success: boolean;
  verificationId?: string;
  error?: string;
  isEtherscanSubmission?: boolean;
}
