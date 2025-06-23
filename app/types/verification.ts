export interface VerificationMethod {
  id: string;
  title: string;
  description: string;
  warning?: React.ReactNode;
}

export interface FrameworkMethod {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export type Language = "solidity" | "vyper";

export interface VerificationMethods {
  solidity: VerificationMethod[];
  vyper: VerificationMethod[];
}

export interface FrameworkMessages {
  [key: string]: string;
}
