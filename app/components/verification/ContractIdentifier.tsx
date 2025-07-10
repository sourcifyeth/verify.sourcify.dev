import { useEffect, useState, useRef, useMemo } from "react";
import { parse } from "@solidity-parser/parser";
import Fuse from "fuse.js";
import type { Language } from "../../types/verification";

interface ParsedContract {
  fileName: string;
  contractName: string;
  fullIdentifier: string;
}

interface ContractIdentifierProps {
  selectedLanguage: Language | null;
  selectedMethod: string;
  contractIdentifier: string;
  onContractIdentifierChange: (identifier: string) => void;
  uploadedFiles: File[];
}

export default function ContractIdentifier({
  selectedLanguage,
  selectedMethod,
  contractIdentifier,
  onContractIdentifierChange,
  uploadedFiles,
}: ContractIdentifierProps) {
  const [parsedContracts, setParsedContracts] = useState<ParsedContract[]>([]);
  const [isParsingFiles, setIsParsingFiles] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Create Fuse instance with the contracts data
  const fuse = useMemo(() => {
    return new Fuse(parsedContracts, {
      keys: ["contractName", "fileName"],
      threshold: 0.3, // Lower threshold means more strict matching
      includeScore: true,
      shouldSort: true,
    });
  }, [parsedContracts]);

  // Filter contracts using Fuse.js
  const filteredContracts = useMemo(() => {
    if (!searchTerm) return parsedContracts;
    return fuse.search(searchTerm).map((result) => result.item);
  }, [searchTerm, fuse, parsedContracts]);

  // Reset contract identifier when language or method changes
  useEffect(() => {
    onContractIdentifierChange("");
  }, [selectedLanguage, selectedMethod]);

  // Parse contracts from uploaded files
  useEffect(() => {
    const parseContractsFromFiles = async () => {
      if (!selectedLanguage || !selectedMethod || selectedMethod === "metadata-json" || uploadedFiles.length === 0) {
        setParsedContracts([]);
        return;
      }

      setIsParsingFiles(true);
      setParseError(null);

      try {
        const contracts: ParsedContract[] = [];

        if (selectedMethod === "std-json") {
          // For std-json, use the first uploaded file
          const jsonFile = uploadedFiles[0];
          if (jsonFile) {
            const jsonContent = await jsonFile.text();
            const stdJson = JSON.parse(jsonContent);

            if (stdJson.sources) {
              for (const [filePath, sourceInfo] of Object.entries(stdJson.sources)) {
                if (sourceInfo && typeof sourceInfo === "object" && "content" in sourceInfo) {
                  const sourceContent = (sourceInfo as any).content;
                  if (typeof sourceContent === "string") {
                    if (selectedLanguage === "solidity") {
                      const fileContracts = await parseFileContent(filePath, sourceContent);
                      contracts.push(...fileContracts);
                    } else if (selectedLanguage === "vyper" && filePath.endsWith(".vy")) {
                      // For Vyper, generate contract identifier from file path
                      const contractName = filePath.split("/").pop()?.replace(".vy", "") || "";
                      if (contractName) {
                        contracts.push({
                          fileName: filePath,
                          contractName,
                          fullIdentifier: `${filePath}:${contractName}`,
                        });
                      }
                    }
                  }
                }
              }
            }
          }
        } else if (selectedMethod === "single-file" || selectedMethod === "multiple-files") {
          // For single/multiple files, parse uploaded files
          for (const file of uploadedFiles) {
            if (selectedLanguage === "solidity") {
              const content = await file.text();
              const fileContracts = await parseFileContent(file.name, content);
              contracts.push(...fileContracts);
            } else if (selectedLanguage === "vyper" && file.name.endsWith(".vy")) {
              // For Vyper, generate contract identifier from file name
              const contractName = file.name.replace(".vy", "");
              contracts.push({
                fileName: file.name,
                contractName,
                fullIdentifier: `${file.name}:${contractName}`,
              });
            }
          }
        }

        // Sort contracts alphabetically by contract name
        const sortedContracts = contracts.sort((a, b) => a.contractName.localeCompare(b.contractName));
        setParsedContracts(sortedContracts);

        // Auto-select the first contract if we have contracts and no current selection
        if (sortedContracts.length > 0) {
          // Only auto-select if there's no current valid selection
          const hasValidSelection = sortedContracts.some((c) => c.fullIdentifier === contractIdentifier);
          if (!hasValidSelection) {
            onContractIdentifierChange(sortedContracts[0].fullIdentifier);
          }
          setShowManualInput(false); // Start with dropdown when contracts are detected
        } else if (sortedContracts.length === 0) {
          setShowManualInput(true); // Show manual input when no contracts detected
        }
      } catch (error) {
        console.error("Error parsing contracts:", error);
        setParseError("Failed to parse contract files");
        setParsedContracts([]);
      } finally {
        setIsParsingFiles(false);
      }
    };

    parseContractsFromFiles();
  }, [selectedLanguage, selectedMethod, uploadedFiles]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  const parseFileContent = async (fileName: string, content: string): Promise<ParsedContract[]> => {
    try {
      const ast = parse(content, {
        loc: false,
        range: false,
      });

      const contracts: ParsedContract[] = [];

      // Traverse AST to find contract definitions
      if (ast.children) {
        for (const child of ast.children) {
          if (child.type === "ContractDefinition" && child.name) {
            contracts.push({
              fileName,
              contractName: child.name,
              fullIdentifier: `${fileName}:${child.name}`,
            });
          }
        }
      }

      return contracts;
    } catch (error) {
      console.warn(`Failed to parse ${fileName}:`, error);
      return [];
    }
  };

  if (
    !selectedLanguage ||
    !selectedMethod ||
    selectedMethod === "metadata-json" ||
    selectedMethod === "hardhat" ||
    selectedMethod === "foundry"
  )
    return null;

  const getPlaceholderText = () => {
    if (selectedLanguage === "vyper") {
      return "contracts/MyContract.vy:MyContract";
    }
    return "contracts/Storage.sol:Storage";
  };

  const getHelpText = () => {
    const text = "The fully qualified file path and contract name of the contract to verify";
    if (selectedLanguage === "vyper") {
      return text + " " + getPlaceholderText();
    }
    return text + " " + getPlaceholderText();
  };

  return (
    <div>
      <label className="block text-base font-semibold text-gray-900 mb-2">Contract Identifier</label>
      <div className="mb-3">
        <p className="text-sm text-gray-600 mb-2">{getHelpText()}</p>

        {parsedContracts.length > 0 && (
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-sm text-gray-700">Select Contract</span>
            <label className="relative inline-flex items-center">
              <input
                type="checkbox"
                checked={showManualInput}
                onChange={(e) => {
                  setShowManualInput(e.target.checked);
                  if (!e.target.checked && parsedContracts.length > 0) {
                    // When switching back to dropdown, select first contract if none selected
                    if (!contractIdentifier || !parsedContracts.some((c) => c.fullIdentifier === contractIdentifier)) {
                      onContractIdentifierChange(parsedContracts[0].fullIdentifier);
                    }
                  }
                }}
                className="sr-only"
              />
              <div
                className={`w-11 h-6 rounded-full relative transition-colors ${
                  showManualInput ? "bg-cerulean-blue-600" : "bg-gray-200"
                }`}
              >
                <div
                  className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform ${
                    showManualInput ? "translate-x-full" : ""
                  }`}
                ></div>
              </div>
            </label>
            <span className="text-sm text-gray-700">Manual Input</span>
          </div>
        )}

        {isParsingFiles && (
          <div className="mt-2 flex items-center space-x-2 text-blue-600">
            <div className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-xs">Parsing contracts...</span>
          </div>
        )}

        {parseError && <div className="mt-2 text-xs text-red-600">{parseError}</div>}

        {uploadedFiles.length > 0 &&
          parsedContracts.length === 0 &&
          !isParsingFiles &&
          selectedLanguage === "vyper" && (
            <div className="mt-2">
              <p className="text-xs text-gray-500">Available Vyper files:</p>
              <ul className="text-xs text-gray-500 ml-2">
                {uploadedFiles
                  .filter((file) => file.name.endsWith(".vy"))
                  .map((file, index) => (
                    <li key={index}>• {file.name}</li>
                  ))}
              </ul>
            </div>
          )}
      </div>

      {parsedContracts.length > 0 && !showManualInput ? (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
              setSearchTerm("");
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:border-cerulean-blue-500 font-mono text-left bg-white flex justify-between items-center text-sm"
          >
            <span>
              {contractIdentifier ? (
                <>
                  {contractIdentifier.substring(0, contractIdentifier.lastIndexOf(":"))}:
                  <span className="font-bold">
                    {contractIdentifier.substring(contractIdentifier.lastIndexOf(":") + 1)}
                  </span>
                </>
              ) : (
                <span className="text-gray-500">Select a contract...</span>
              )}
            </span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              <div className="p-2 border-b border-gray-200">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search contracts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cerulean-blue-500 focus:border-cerulean-blue-500"
                />
              </div>
              <div className="max-h-60 overflow-auto">
                {filteredContracts.length > 0 ? (
                  filteredContracts.map((contract, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        onContractIdentifierChange(contract.fullIdentifier);
                        setIsDropdownOpen(false);
                        setSearchTerm("");
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none font-mono text-sm"
                    >
                      {contract.fileName}:<span className="font-bold">{contract.contractName}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">No contracts found matching "{searchTerm}"</div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <input
          type="text"
          value={contractIdentifier}
          onChange={(e) => onContractIdentifierChange(e.target.value)}
          placeholder={getPlaceholderText()}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:border-cerulean-blue-500"
        />
      )}
    </div>
  );
}
