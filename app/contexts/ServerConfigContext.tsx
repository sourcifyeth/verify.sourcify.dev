import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface ServerConfigContextType {
  serverUrl: string;
  setServerUrl: (url: string) => void;
  getDefaultServerUrls: () => string[];
}

const ServerConfigContext = createContext<ServerConfigContextType | undefined>(undefined);

export function ServerConfigProvider({ children }: { children: ReactNode }) {
  const [serverUrl, setServerUrl] = useState(import.meta.env.VITE_SOURCIFY_SERVER_URL || "https://sourcify.dev/server");

  const getDefaultServerUrls = () => {
    const urls = [import.meta.env.VITE_SOURCIFY_SERVER_URL || "https://sourcify.dev/server"];
    if (import.meta.env.DEV) {
      urls.push("http://localhost:5555");
    }
    return urls;
  };

  return (
    <ServerConfigContext.Provider value={{ serverUrl, setServerUrl, getDefaultServerUrls }}>
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
