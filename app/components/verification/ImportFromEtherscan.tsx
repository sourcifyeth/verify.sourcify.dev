import { useState } from "react";
import { fetchFromEtherscan, processEtherscanResult } from "../../utils/etherscanApi";
import { hasEtherscanApiKey, getEtherscanApiKey } from "../../utils/etherscanStorage";

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
  
  const canImport = hasEtherscanApiKey() && chainId && address;

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

  const getButtonText = () => {
    if (isImporting) return "Importing...";
    if (!hasEtherscanApiKey()) return "Add API key in settings";
    if (!chainId || !address) return "Select chain and address";
    return "Import from Etherscan";
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleImport}
        disabled={!canImport || isImporting}
        className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          canImport && !isImporting
            ? "bg-orange-500 text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        {isImporting && (
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
        )}
        <div className="flex items-center space-x-2">
          {/* Dummy logo placeholder */}
          <div className="w-4 h-4 bg-gray-400 rounded-sm flex items-center justify-center">
            <span className="text-xs text-white font-bold">E</span>
          </div>
          <span>{getButtonText()}</span>
        </div>
      </button>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-2">
          {success}
        </div>
      )}

      {!hasEtherscanApiKey() && (
        <p className="text-xs text-gray-500">
          Add your Etherscan API key in settings to import verified contracts
        </p>
      )}
    </div>
  );
}