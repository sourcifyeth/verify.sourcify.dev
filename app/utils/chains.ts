import type { Chain } from "../types/chains";

export async function fetchChains(serverUrl: string): Promise<Chain[]> {
  try {
    const response = await fetch(`${serverUrl}/chains`);

    if (!response.ok) {
      throw new Error(`Failed to fetch chains: ${response.status} ${response.statusText}`);
    }

    const chains: Chain[] = await response.json();

    // Filter to only show supported chains
    return chains;
  } catch (error) {
    console.error("Error fetching chains:", error);
    throw new Error(`Failed to fetch chains from ${serverUrl}: ${error}`);
  }
}

export function getChainById(chains: Chain[], chainId: number): Chain | undefined {
  return chains.find((chain) => chain.chainId === chainId);
}

export function getChainName(chains: Chain[], chainId: number): string {
  const chain = getChainById(chains, chainId);
  return chain?.title || chain?.name || `Chain ${chainId}`;
}
