export interface Chain {
  name: string;
  title?: string;
  chainId: number;
  rpc: string[];
  traceSupportedRPCs?: Array<{
    type: string;
    index: number;
  }>;
  supported: boolean;
  etherscanAPI: boolean;
  // Custom Etherscan-compatible explorer API URL. Present for chains whose
  // contracts must be imported from a non-canonical explorer instead of
  // api.etherscan.io (e.g. chain 627). Falls back to the canonical Etherscan
  // API when undefined.
  etherscanApiUrl?: string;
}

export interface ChainsResponse {
  chains: Chain[];
  loading: boolean;
  error: string | null;
}
