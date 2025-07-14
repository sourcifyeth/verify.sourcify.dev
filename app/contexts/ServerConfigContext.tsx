import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { getCurrentServerUrl, setCurrentServerUrl, getCustomServerUrls, setCustomServerUrls } from "../utils/serverStorage";

interface ServerConfigContextType {
  serverUrl: string;
  setServerUrl: (url: string) => void;
  getDefaultServerUrls: () => string[];
  customServerUrls: string[];
  setCustomServerUrls: (urls: string[]) => void;
}

const ServerConfigContext = createContext<ServerConfigContextType | undefined>(undefined);

export function ServerConfigProvider({ children }: { children: ReactNode }) {
  const getDefaultServerUrls = () => {
    const urls = [import.meta.env.VITE_SOURCIFY_SERVER_URL || "https://sourcify.dev/server"];
    if (import.meta.env.DEV) {
      urls.push("http://localhost:5555");
    }
    return urls;
  };

  // Initialize server URL from localStorage or use default
  const [serverUrl, setServerUrlState] = useState(() => {
    const storedUrl = getCurrentServerUrl();
    return storedUrl || getDefaultServerUrls()[0];
  });

  // Initialize custom server URLs from localStorage
  const [customServerUrls, setCustomServerUrlsState] = useState(() => {
    return getCustomServerUrls();
  });

  // Sync with localStorage when server URL changes
  const handleSetServerUrl = (url: string) => {
    setCurrentServerUrl(url);
    setServerUrlState(url);
  };

  // Sync with localStorage when custom URLs change
  const handleSetCustomServerUrls = (urls: string[]) => {
    setCustomServerUrls(urls);
    setCustomServerUrlsState(urls);
  };

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUrl = getCurrentServerUrl();
      const storedCustomUrls = getCustomServerUrls();
      
      if (storedUrl && storedUrl !== serverUrl) {
        setServerUrlState(storedUrl);
      }
      setCustomServerUrlsState(storedCustomUrls);
    };

    window.addEventListener("serverUrlChanged", handleStorageChange);
    return () => window.removeEventListener("serverUrlChanged", handleStorageChange);
  }, [serverUrl]);

  return (
    <ServerConfigContext.Provider value={{ 
      serverUrl, 
      setServerUrl: handleSetServerUrl, 
      getDefaultServerUrls,
      customServerUrls,
      setCustomServerUrls: handleSetCustomServerUrls
    }}>
      {children}
    </ServerConfigContext.Provider>
  );
}

export function useServerConfig() {
  const context = useContext(ServerConfigContext);
  if (context === undefined) {
    throw new Error("useServerConfig must be used within a ServerConfigProvider");
  }
  return context;
}
