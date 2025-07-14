const ETHERSCAN_API_KEY_STORAGE_KEY = "etherscan-api-key";

export const getEtherscanApiKey = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ETHERSCAN_API_KEY_STORAGE_KEY);
};

export const setEtherscanApiKey = (apiKey: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(ETHERSCAN_API_KEY_STORAGE_KEY, apiKey);
};

export const removeEtherscanApiKey = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ETHERSCAN_API_KEY_STORAGE_KEY);
};

export const hasEtherscanApiKey = (): boolean => {
  const apiKey = getEtherscanApiKey();
  return apiKey !== null && apiKey.trim().length > 0;
};