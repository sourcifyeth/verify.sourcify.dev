import React, { createContext, useContext, useState, useEffect } from "react";

export interface SolidityVersion {
  version: string;
  filename: string;
  isNightly: boolean;
}

export interface VyperVersion {
  version: string;
  longVersion: string;
  isPrerelease: boolean;
}

interface CompilerVersionsContextType {
  // Solidity versions
  solidityVersions: SolidityVersion[];
  officialSolidityVersions: SolidityVersion[];

  // Vyper versions
  vyperVersions: VyperVersion[];
  officialVyperVersions: VyperVersion[];

  // Loading states
  isSolidityLoading: boolean;
  isVyperLoading: boolean;

  // Error states
  solidityError: string | null;
  vyperError: string | null;
}

const CompilerVersionsContext = createContext<CompilerVersionsContextType | undefined>(undefined);

const SOLC_VERSIONS_LIST_URL = "https://raw.githubusercontent.com/ethereum/solc-bin/gh-pages/bin/list.txt";
const VYPER_VERSIONS_LIST_URL = "https://vyper-releases-mirror.hardhat.org/list.json";

function formatSolidityVersionName(filename: string): SolidityVersion {
  // Remove "soljson-v" prefix and ".js" suffix
  const versionPart = filename.replace(/^soljson-v/, "").replace(/\.js$/, "");
  const isNightly = versionPart.includes("nightly");

  return {
    version: versionPart,
    filename,
    isNightly,
  };
}

function getVersionWithCommit(assetName: string): string {
  // Remove vyper. prefix and platform suffix (.darwin, .linux, .windows.exe)
  return assetName.replace(/^vyper\./, "").replace(/\.(darwin|linux|windows\.exe)$/, "");
}

interface HardhatVyperVersion {
  tag_name: string;
  assets: {
    name: string;
    browser_download_url: string;
  }[];
}

export function CompilerVersionsProvider({ children }: { children: React.ReactNode }) {
  const [solidityVersions, setSolidityVersions] = useState<SolidityVersion[]>([]);
  const [officialSolidityVersions, setOfficialSolidityVersions] = useState<SolidityVersion[]>([]);
  const [vyperVersions, setVyperVersions] = useState<VyperVersion[]>([]);
  const [officialVyperVersions, setOfficialVyperVersions] = useState<VyperVersion[]>([]);

  const [isSolidityLoading, setIsSolidityLoading] = useState(true);
  const [isVyperLoading, setIsVyperLoading] = useState(true);
  const [solidityError, setSolidityError] = useState<string | null>(null);
  const [vyperError, setVyperError] = useState<string | null>(null);

  // Fetch Solidity versions
  useEffect(() => {
    fetch(SOLC_VERSIONS_LIST_URL)
      .then((response) => response.text())
      .then((text) => {
        const allVersionsList = text
          .split("\n")
          .filter((line) => line.trim() && line.startsWith("soljson-v"))
          .map((line) => formatSolidityVersionName(line.trim()));

        setSolidityVersions(allVersionsList);
        setOfficialSolidityVersions(allVersionsList.filter((version) => !version.isNightly));
        setIsSolidityLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch Solidity versions:", error);
        setIsSolidityLoading(false);
        setSolidityError("Failed to fetch Solidity compiler versions");
      });
  }, []);

  // Fetch Vyper versions
  useEffect(() => {
    fetch(VYPER_VERSIONS_LIST_URL)
      .then((response) => response.json())
      .then((data: HardhatVyperVersion[]) => {
        const allVersionsList: VyperVersion[] = data
          .filter((release) => release.assets.length > 0)
          .map((release) => {
            const versionWithCommit = getVersionWithCommit(release.assets[0].name);
            const version = release.tag_name.replace(/^v/, ""); // Remove 'v' prefix
            // Check if tag has suffix after version (e.g., v0.4.1b1 is prerelease, v0.4.1 is not)
            const isPrerelease = /^v\d+\.\d+\.\d+.+/.test(release.tag_name);

            return {
              version,
              longVersion: versionWithCommit,
              isPrerelease,
            };
          });

        setVyperVersions(allVersionsList);
        setOfficialVyperVersions(allVersionsList.filter((version) => !version.isPrerelease));
        setIsVyperLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch Vyper versions:", error);
        setIsVyperLoading(false);
        setVyperError("Failed to fetch Vyper compiler versions");
      });
  }, []);

  return (
    <CompilerVersionsContext.Provider
      value={{
        solidityVersions,
        officialSolidityVersions,
        vyperVersions,
        officialVyperVersions,
        isSolidityLoading,
        isVyperLoading,
        solidityError,
        vyperError,
      }}
    >
      {children}
    </CompilerVersionsContext.Provider>
  );
}

export function useCompilerVersions() {
  const context = useContext(CompilerVersionsContext);
  if (context === undefined) {
    throw new Error("useCompilerVersions must be used within a CompilerVersionsProvider");
  }
  return context;
}
