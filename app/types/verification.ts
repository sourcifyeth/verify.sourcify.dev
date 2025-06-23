export type Language = "solidity" | "vyper";

export interface VerificationMethod {
  id: string;
  title: string;
  description: string;
  warning?: React.ReactNode;
}

export interface FrameworkMethod {
  id: string;
  title: string;
  icon: string;
}

export interface VerificationMethods {
  solidity: VerificationMethod[];
  vyper: VerificationMethod[];
}

export interface FrameworkMessages {
  [key: string]: React.ReactNode;
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
