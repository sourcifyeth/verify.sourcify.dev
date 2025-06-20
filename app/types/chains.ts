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
}

export interface ChainsResponse {
  chains: Chain[];
  loading: boolean;
  error: string | null;
}
