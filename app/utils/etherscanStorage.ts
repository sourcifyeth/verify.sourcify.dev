import { useState, useEffect } from "react";

const ETHERSCAN_API_KEY_STORAGE_KEY = "etherscan-api-key";
const ETHERSCAN_API_KEY_CHANGED_EVENT = "etherscan-api-key-changed";

export const getEtherscanApiKey = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ETHERSCAN_API_KEY_STORAGE_KEY);
};

export const setEtherscanApiKey = (apiKey: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(ETHERSCAN_API_KEY_STORAGE_KEY, apiKey);
  // Dispatch custom event to notify components
  window.dispatchEvent(new CustomEvent(ETHERSCAN_API_KEY_CHANGED_EVENT));
};

export const removeEtherscanApiKey = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ETHERSCAN_API_KEY_STORAGE_KEY);
  // Dispatch custom event to notify components
  window.dispatchEvent(new CustomEvent(ETHERSCAN_API_KEY_CHANGED_EVENT));
};

export const hasEtherscanApiKey = (): boolean => {
  const apiKey = getEtherscanApiKey();
  return apiKey !== null && apiKey.trim().length > 0;
};

// Custom hook to listen for API key changes
export const useEtherscanApiKey = () => {
  const [hasApiKey, setHasApiKey] = useState(hasEtherscanApiKey());

  useEffect(() => {
    const handleApiKeyChange = () => {
      setHasApiKey(hasEtherscanApiKey());
    };

    window.addEventListener(ETHERSCAN_API_KEY_CHANGED_EVENT, handleApiKeyChange);
    
    return () => {
      window.removeEventListener(ETHERSCAN_API_KEY_CHANGED_EVENT, handleApiKeyChange);
    };
  }, []);

  return hasApiKey;
};