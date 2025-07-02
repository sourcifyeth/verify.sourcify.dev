import type { AllChainsResponse, VerifiedContractMinimal } from "../types/verification";

const SOURCIFY_REPO_URL = import.meta.env.VITE_SOURCIFY_REPO_URL || "https://repo.sourcify.dev";

export async function fetchVerifiedAllChains(serverUrl: string, address: string): Promise<VerifiedContractMinimal[]> {
  try {
    const response = await fetch(`${serverUrl}/v2/contract/all-chains/${address}`);

    if (!response.ok) {
      if (response.status === 404) {
        // No verified contracts found - this is expected, return empty array
        return [];
      }
      throw new Error(`Failed to fetch verified contracts: ${response.status} ${response.statusText}`);
    }

    const data: AllChainsResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error fetching verified contracts:", error);
    throw error;
  }
}

export async function fetchVerifiedContract(serverUrl: string, chainId: string, address: string): Promise<VerifiedContractMinimal | null> {
  try {
    const response = await fetch(`${serverUrl}/v2/contract/${chainId}/${address}`);

    if (!response.ok) {
      if (response.status === 404) {
        // Contract not verified on this chain - this is expected, return null
        return null;
      }
      throw new Error(`Failed to fetch verified contract: ${response.status} ${response.statusText}`);
    }

    const data: VerifiedContractMinimal = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching verified contract:", error);
    throw error;
  }
}

export function getRepoLink(chainId: string, address: string): string {
  return `${SOURCIFY_REPO_URL}/${chainId}/${address}`;
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
