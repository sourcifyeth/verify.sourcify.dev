import { useState } from "react";
import { isAddress } from "ethers";
import { fetchFromEtherscan, processEtherscanResult } from "../../utils/etherscanApi";
import { useEtherscanApiKey, getEtherscanApiKey } from "../../utils/etherscanStorage";

interface ImportFromEtherscanProps {
  chainId: string;
  address: string;
  onImportSuccess: (data: {
    language: string;
    verificationMethod: string;
    compilerVersion: string;
    contractName: string;
    files: File[];
    compilerSettings: {
      evmVersion: string;
      optimizerEnabled: boolean;
      optimizerRuns: number;
    };
  }) => void;
}

export default function ImportFromEtherscan({ chainId, address, onImportSuccess }: ImportFromEtherscanProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Use the custom hook to reactively track API key changes
  const hasApiKey = useEtherscanApiKey();

  // Validate address using ethers isAddress function
  const isAddressValid = address ? isAddress(address) : false;

  const canImport = hasApiKey && chainId && address && isAddressValid;

  const handleImport = async () => {
    if (!canImport) return;

    setIsImporting(true);
    setError(null);
    setSuccess(null);

    try {
      const apiKey = getEtherscanApiKey();
      if (!apiKey) {
        throw new Error("No Etherscan API key found");
      }

      const etherscanResult = await fetchFromEtherscan(chainId, address, apiKey);
      const processedResult = await processEtherscanResult(etherscanResult);

      onImportSuccess(processedResult);

      setSuccess(`Successfully imported ${processedResult.contractName} from Etherscan`);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "An unexpected error occurred");
    } finally {
      setIsImporting(false);
    }
  };

  const getValidationMessage = () => {
    if (!hasApiKey) return "Add an API key in settings";
    if (!chainId) return "Select a chain to enable import";
    if (!address) return "Enter a contract address to enable import";
    if (!isAddressValid) return "Enter a valid contract address to enable import";
    return null;
  };

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={handleImport}
        disabled={!canImport || isImporting}
        className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          canImport && !isImporting
            ? "bg-cerulean-blue-500 text-white hover:bg-cerulean-blue-600 focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:ring-offset-2"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        {isImporting && (
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
        )}
        <div className="flex items-center space-x-2">
          {/* Dummy logo placeholder */}
          <img src="/etherscan.webp" alt="Etherscan" className="w-5 h-5 bg-white p-[1px] rounded-full" />
          <span>{isImporting ? "Importing..." : "Import from Etherscan"}</span>
        </div>
      </button>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</div>}

      {success && (
        <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-2">{success}</div>
      )}

      {getValidationMessage() && <p className="text-xs text-gray-500">{getValidationMessage()}</p>}
    </div>
  );
}
