import type { Chain } from "../types/chains";

/**
 * Custom fetch function for Sourcify API calls that adds User-Agent header
 */
function sourcifyFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const gitCommit = import.meta.env.VITE_GIT_COMMIT || "dev";
  const userAgent = `Sourcify-UI/${gitCommit} (verify.sourcify.dev; Web)`;
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "User-Agent": userAgent,
    },
  });
}

export async function fetchChains(serverUrl: string): Promise<Chain[]> {
  try {
    const response = await sourcifyFetch(`${serverUrl}/chains`);

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
