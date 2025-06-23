import type { Chain } from "../types/chains";

const SOURCIFY_SERVER_URL = import.meta.env.VITE_SOURCIFY_SERVER_URL || "https://sourcify.dev/server";

export async function fetchChains(): Promise<Chain[]> {
  try {
    const response = await fetch(`${SOURCIFY_SERVER_URL}/chains`);

    if (!response.ok) {
      throw new Error(`Failed to fetch chains: ${response.status} ${response.statusText}`);
    }

    const chains: Chain[] = await response.json();

    // Filter to only show supported chains
    return chains;
  } catch (error) {
    console.error("Error fetching chains:", error);
    throw error;
  }
}

export function getChainById(chains: Chain[], chainId: number): Chain | undefined {
  return chains.find((chain) => chain.chainId === chainId);
}

export function getChainName(chains: Chain[], chainId: number): string {
  const chain = getChainById(chains, chainId);
  return chain?.title || chain?.name || `Chain ${chainId}`;
}
