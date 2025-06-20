import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Chain } from "../types/chains";
import { fetchChains } from "../utils/chains";

interface ChainsContextType {
  chains: Chain[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const ChainsContext = createContext<ChainsContextType | undefined>(undefined);

export function ChainsProvider({ children }: { children: ReactNode }) {
  const [chains, setChains] = useState<Chain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChains = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedChains = await fetchChains();
      setChains(fetchedChains);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch chains");
      console.error("Error loading chains:", err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await loadChains();
  };

  useEffect(() => {
    loadChains();
  }, []);

  return <ChainsContext.Provider value={{ chains, loading, error, refetch }}>{children}</ChainsContext.Provider>;
}

export function useChains() {
  const context = useContext(ChainsContext);
  if (context === undefined) {
    throw new Error("useChains must be used within a ChainsProvider");
  }
  return context;
}
