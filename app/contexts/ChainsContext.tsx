import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Chain } from "../types/chains";
import { fetchChains } from "../utils/chains";
import { useServerConfig } from "./ServerConfigContext";

// Cache configuration
const CACHE_KEY = "sourcify_chains_cache";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

interface CachedChains {
  chains: Chain[];
  timestamp: number;
  serverUrl: string;
}

interface ChainsContextType {
  chains: Chain[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const ChainsContext = createContext<ChainsContextType | undefined>(undefined);

export function ChainsProvider({ children }: { children: ReactNode }) {
  const { serverUrl } = useServerConfig();
  const [chains, setChains] = useState<Chain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCachedChains = (): CachedChains | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const parsedCache: CachedChains = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid and for the same server
      if (now - parsedCache.timestamp < CACHE_DURATION && parsedCache.serverUrl === serverUrl) {
        return parsedCache;
      }

      // Cache is expired or for different server, remove it
      localStorage.removeItem(CACHE_KEY);
      return null;
    } catch (err) {
      console.error("Error reading chains cache:", err);
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  };

  const setCachedChains = (chains: Chain[]) => {
    try {
      const cacheData: CachedChains = {
        chains,
        timestamp: Date.now(),
        serverUrl,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (err) {
      console.error("Error caching chains:", err);
    }
  };

  const loadChains = async (useCache = true) => {
    try {
      setLoading(true);
      setError(null);

      // Try to load from cache first
      if (useCache) {
        const cachedChains = getCachedChains();
        if (cachedChains) {
          setChains(cachedChains.chains);
          setLoading(false);
          return;
        }
      }

      // Fetch from API if no valid cache
      const fetchedChains = await fetchChains(serverUrl);
      setChains(fetchedChains);
      setCachedChains(fetchedChains);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch chains");
      console.error("Error loading chains:", err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await loadChains(false); // Force refresh, skip cache
  };

  useEffect(() => {
    // Load chains immediately (will use cache if available)
    loadChains();
  }, [serverUrl]);

  return <ChainsContext.Provider value={{ chains, loading, error, refetch }}>{children}</ChainsContext.Provider>;
}

export function useChains() {
  const context = useContext(ChainsContext);
  if (context === undefined) {
    throw new Error("useChains must be used within a ChainsProvider");
  }
  return context;
}
