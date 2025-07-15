import { useState } from "react";
import { isAddress } from "ethers";
import { submitEtherscanVerification } from "../../utils/sourcifyApi";
import { useEtherscanApiKey, getEtherscanApiKey } from "../../utils/etherscanStorage";
import { saveJob } from "../../utils/jobStorage";
import { useServerConfig } from "../../contexts/ServerConfigContext";
import { useCompilerVersions } from "../../contexts/CompilerVersionsContext";

interface ImportFromEtherscanProps {
  chainId: string;
  address: string;
  setIsSubmitting: (isSubmitting: boolean) => void;
  setSubmissionResult: (
    result: {
      success: boolean;
      verificationId?: string;
      error?: string;
    } | null
  ) => void;
  onImportError: (error: string) => void;
  onImportSuccess: (message: string) => void;
}

export default function ImportFromEtherscan({
  chainId,
  address,
  setIsSubmitting,
  setSubmissionResult,
  onImportError,
  onImportSuccess,
}: ImportFromEtherscanProps) {
  const [isImporting, setIsImporting] = useState(false);
  const { serverUrl } = useServerConfig();
  const { vyperVersions } = useCompilerVersions();

  // Use the custom hook to reactively track API key changes
  const hasApiKey = useEtherscanApiKey();

  // Validate address using ethers isAddress function
  const isAddressValid = address ? isAddress(address) : false;

  const canImport = hasApiKey && chainId && address && isAddressValid;

  const handleImport = async () => {
    if (!canImport) return;

    setIsImporting(true);
    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      const apiKey = getEtherscanApiKey();
      if (!apiKey) {
        throw new Error("No Etherscan API key found");
      }

      // Submit verification directly
      const result = await submitEtherscanVerification(serverUrl, chainId, address, apiKey, vyperVersions);

      // Set successful submission result
      setSubmissionResult({
        success: true,
        verificationId: result.verificationId,
      });

      // Save job to localStorage
      saveJob({
        verificationId: result.verificationId,
        isJobCompleted: false,
        jobStartTime: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        contract: {
          chainId,
          address,
        },
      });

      onImportSuccess(`Successfully imported and submitted verification from Etherscan`);
    } catch (err) {
      const error = err as Error;
      onImportError(error.message || "An unexpected error occurred");
    } finally {
      setIsImporting(false);
      setIsSubmitting(false);
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

      {getValidationMessage() && <p className="text-xs text-gray-500">{getValidationMessage()}</p>}
    </div>
  );
}
