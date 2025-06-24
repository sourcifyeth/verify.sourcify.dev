import React, { useState } from "react";
import { useCompilerVersions } from "../../contexts/CompilerVersionsContext";
import type { SolidityVersion, VyperVersion } from "../../contexts/CompilerVersionsContext";
import type { Language, VerificationMethodObject, FrameworkMethodObject } from "../../types/verification";

interface CompilerSelectorProps {
  language: Language | null;
  verificationMethod: VerificationMethodObject | FrameworkMethodObject | null;
  selectedVersion?: string;
  onVersionSelect: (version: string) => void;
}

export default function CompilerSelector({
  language,
  verificationMethod,
  selectedVersion,
  onVersionSelect,
}: CompilerSelectorProps) {
  const {
    solidityVersions,
    officialSolidityVersions,
    vyperVersions,
    officialVyperVersions,
    isSolidityLoading,
    isVyperLoading,
    solidityError,
    vyperError,
  } = useCompilerVersions();

  const [showNightlyBuilds, setShowNightlyBuilds] = useState(false);
  const [showPrereleases, setShowPrereleases] = useState(false);

  // Don't show if language is null or if using metadata/framework methods
  if (!language || !verificationMethod) {
    return null;
  }

  if (
    verificationMethod.id === "metadata-json" ||
    verificationMethod.id === "hardhat" ||
    verificationMethod.id === "foundry"
  ) {
    return null;
  }

  const isLoading = language === "solidity" ? isSolidityLoading : isVyperLoading;
  const error = language === "solidity" ? solidityError : vyperError;

  if (isLoading) {
    return (
      <div>
        <label className="block text-base font-semibold text-gray-900 mb-2">Compiler Version</label>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 border-2 border-cerulean-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500">Loading compiler versions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <label className="block text-base font-semibold text-gray-900 mb-2">Compiler Version</label>
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  const getVersionsToShow = () => {
    if (language === "solidity") {
      return showNightlyBuilds ? solidityVersions : officialSolidityVersions;
    } else {
      return showPrereleases ? vyperVersions : officialVyperVersions;
    }
  };

  const versionsToShow = getVersionsToShow();

  const formatVersionForDisplay = (version: SolidityVersion | VyperVersion) => {
    if (language === "solidity") {
      return (version as SolidityVersion).version;
    } else {
      const vyperVersion = version as VyperVersion;
      return vyperVersion.longVersion;
    }
  };

  const getVersionValue = (version: SolidityVersion | VyperVersion) => {
    if (language === "solidity") {
      return (version as SolidityVersion).version;
    } else {
      return (version as VyperVersion).longVersion;
    }
  };

  return (
    <div>
      <label htmlFor="compilerVersion" className="block text-base font-semibold text-gray-900 mb-2">
        Compiler Version
      </label>
      <div className="space-y-3">
        <div className="relative">
          <select
            id="compilerVersion"
            value={selectedVersion || ""}
            onChange={(e) => onVersionSelect(e.target.value)}
            className="w-full appearance-none cursor-pointer border border-gray-300 rounded-md px-3 py-2 bg-white hover:border-cerulean-blue-300 focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:border-cerulean-blue-500 shadow-sm text-gray-900"
          >
            <option value="">Select compiler version</option>
            {versionsToShow.map((version) => (
              <option key={getVersionValue(version)} value={getVersionValue(version)}>
                {formatVersionForDisplay(version)}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id={`show${language === "solidity" ? "Nightly" : "Prerelease"}`}
            checked={language === "solidity" ? showNightlyBuilds : showPrereleases}
            onChange={(e) => {
              if (language === "solidity") {
                setShowNightlyBuilds(e.target.checked);
              } else {
                setShowPrereleases(e.target.checked);
              }
            }}
            className="h-4 w-4 text-cerulean-blue-600 focus:ring-cerulean-blue-500 border-gray-300 rounded hover:cursor-pointer"
          />
          <label
            htmlFor={`show${language === "solidity" ? "Nightly" : "Prerelease"}`}
            className="ml-2 block text-sm text-gray-700 hover:cursor-pointer"
          >
            {language === "solidity" ? "Show nightly builds" : "Show prereleases"}
          </label>
        </div>
      </div>
    </div>
  );
}
