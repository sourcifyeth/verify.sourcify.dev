import type { Route } from "./+types/verify";
import { useChains } from "../contexts/ChainsContext";
import PageLayout from "../components/PageLayout";
import { useVerificationState } from "../hooks/useVerificationState";
import { useFormValidation } from "../hooks/useFormValidation";
import LanguageSelector from "../components/verification/LanguageSelector";
import VerificationMethodSelector from "../components/verification/VerificationMethodSelector";
import ChainAndAddress from "../components/verification/ChainAndAddress";
import CompilerSelector from "../components/verification/CompilerSelector";
import LicenseInfo from "../components/verification/LicenseInfo";
import FileUpload from "../components/verification/FileUpload";
import CompilerSettings from "../components/verification/CompilerSettings";
import ContractIdentifier from "../components/verification/ContractIdentifier";
import { verificationMethods, frameworkMethods } from "../data/verificationMethods";
import type { VerificationMethod } from "../types/verification";
import { assembleAndSubmitStandardJson, submitStdJsonFile, submitMetadataVerification } from "../utils/sourcifyApi";
import { buildMetadataSubmissionSources } from "../utils/metadataValidation";
import MetadataValidation from "../components/verification/MetadataValidation";
import React, { useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "verify.sourcify.dev" },
    { name: "description", content: "Verify your smart contracts with Sourcify" },
  ];
}

export default function Verify() {
  const { chains } = useChains();
  const {
    selectedChainId,
    contractAddress,
    selectedLanguage,
    selectedMethod,
    selectedCompilerVersion,
    uploadedFiles,
    metadataFile,
    evmVersion,
    optimizerEnabled,
    optimizerRuns,
    contractIdentifier,
    handleChainIdChange,
    handleContractAddressChange,
    handleLanguageSelect,
    handleMethodSelect,
    handleCompilerVersionSelect,
    handleFilesChange,
    handleMetadataFileChange,
    handleEvmVersionChange,
    handleOptimizerEnabledChange,
    handleOptimizerRunsChange,
    handleContractIdentifierChange,
    isSubmitting,
    setIsSubmitting,
    submissionResult,
    setSubmissionResult,
  } = useVerificationState();

  // Track metadata validation status
  const [isMetadataValid, setIsMetadataValid] = useState(false);

  const {
    isFormValid,
    errors,
    updateAddressValidation,
    updateChainId,
    updateLanguage,
    updateMethod,
    updateCompilerVersion,
    getSubmissionErrors,
    isFrameworkMethod,
    isCompilerVersionRequired,
  } = useFormValidation();

  // Sync verification state with validation hook
  React.useEffect(() => {
    updateChainId(selectedChainId);
  }, [selectedChainId, updateChainId]);

  React.useEffect(() => {
    updateLanguage(selectedLanguage);
  }, [selectedLanguage, updateLanguage]);

  React.useEffect(() => {
    updateMethod(selectedMethod);
  }, [selectedMethod, updateMethod]);

  React.useEffect(() => {
    updateCompilerVersion(selectedCompilerVersion);
  }, [selectedCompilerVersion, updateCompilerVersion]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      const submissionErrors = getSubmissionErrors();
      console.log("Form submission blocked. Missing:", submissionErrors);
      // You could show a toast or alert here with the errors
      return;
    }

    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      let result;

      if (selectedMethod === "metadata-json") {
        // Handle metadata-json method
        if (!metadataFile) {
          throw new Error("No metadata.json file uploaded");
        }
        
        const { sources, metadata } = await buildMetadataSubmissionSources(
          metadataFile,
          uploadedFiles
        );
        
        result = await submitMetadataVerification(
          selectedChainId,
          contractAddress,
          sources,
          metadata
        );
      } else if (selectedMethod === "std-json") {
        // For std-json method, use the uploaded file directly
        if (uploadedFiles.length === 0) {
          throw new Error("No standard JSON file uploaded");
        }

        result = await submitStdJsonFile(
          selectedChainId,
          contractAddress,
          uploadedFiles[0],
          selectedCompilerVersion,
          contractIdentifier
        );
      } else {
        // For single-file and multiple-files methods, assemble standard JSON
        if (uploadedFiles.length === 0) {
          throw new Error("No files uploaded");
        }

        result = await assembleAndSubmitStandardJson(
          selectedChainId,
          contractAddress,
          uploadedFiles,
          selectedLanguage!,
          selectedCompilerVersion,
          contractIdentifier,
          {
            evmVersion,
            optimizerEnabled,
            optimizerRuns,
          }
        );
      }

      setSubmissionResult({
        success: true,
        verificationId: result.verificationId,
      });
    } catch (error) {
      setSubmissionResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubmitButtonTooltip = () => {
    if (isFrameworkMethod) {
      return "Framework helpers provide setup instructions only - please select a verification method above";
    }
    if (!isFormValid) {
      return "Please complete all required fields";
    }
    return "Submit verification";
  };

  // Helper function to get the method object from the selected method ID
  const getSelectedMethodObject = () => {
    if (!selectedMethod || !selectedLanguage) return null;

    // Check verification methods first
    const verificationMethod = verificationMethods[selectedLanguage]?.find((m) => m.id === selectedMethod);
    if (verificationMethod) return verificationMethod;

    // Check framework methods
    const frameworkMethod = frameworkMethods.find((m) => m.id === selectedMethod);
    return frameworkMethod || null;
  };

  return (
    <div className="pb-12 bg-cerulean-blue-50 pt-1">
      <PageLayout title="Verify Smart Contracts">
        <>
          <div className="p-8">
            <form className="space-y-12" onSubmit={handleSubmit}>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sourcify Server</h3>
                <div className="text-sm text-gray-600">
                  <p>Server URL: {import.meta.env.VITE_SOURCIFY_SERVER_URL || "https://sourcify.dev/server"}</p>
                </div>
              </div>
              <ChainAndAddress
                selectedChainId={selectedChainId}
                contractAddress={contractAddress}
                onChainIdChange={handleChainIdChange}
                onContractAddressChange={handleContractAddressChange}
                chains={chains}
                onValidationChange={updateAddressValidation}
              />

              <LicenseInfo />

              <LanguageSelector selectedLanguage={selectedLanguage} onLanguageSelect={handleLanguageSelect} />

              {selectedLanguage && (
                <VerificationMethodSelector
                  selectedLanguage={selectedLanguage}
                  selectedMethod={selectedMethod}
                  onMethodSelect={handleMethodSelect}
                />
              )}

              {!isFrameworkMethod && !!selectedMethod && (
                <>
                  <FileUpload
                    selectedMethod={selectedMethod as VerificationMethod}
                    selectedLanguage={selectedLanguage}
                    onFilesChange={selectedMethod === "metadata-json" ? handleMetadataFileChange : handleFilesChange}
                    uploadedFiles={
                      selectedMethod === "metadata-json" ? (metadataFile ? [metadataFile] : []) : uploadedFiles
                    }
                  />

                  {selectedMethod === "metadata-json" && (
                    <>
                      {/* Metadata Validation - Show between metadata and source file uploads */}
                      <MetadataValidation
                        metadataFile={metadataFile}
                        uploadedFiles={uploadedFiles}
                        onValidationChange={setIsMetadataValid}
                      />
                      
                      {/* Render an additional file upload for the sources when the method is metadata-json. We can treat the sources' file upload as a multiple-files case. */}
                      <FileUpload
                        selectedMethod={"multiple-files" as VerificationMethod}
                        selectedLanguage={selectedLanguage}
                        onFilesChange={handleFilesChange}
                        uploadedFiles={uploadedFiles}
                      />
                    </>
                  )}
                </>
              )}

              <CompilerSelector
                language={selectedLanguage}
                verificationMethod={getSelectedMethodObject()}
                selectedVersion={selectedCompilerVersion}
                onVersionSelect={handleCompilerVersionSelect}
              />

              <CompilerSettings
                selectedLanguage={selectedLanguage}
                selectedMethod={selectedMethod}
                isFrameworkMethod={isFrameworkMethod}
                evmVersion={evmVersion}
                optimizerEnabled={optimizerEnabled}
                optimizerRuns={optimizerRuns}
                onEvmVersionChange={handleEvmVersionChange}
                onOptimizerEnabledChange={handleOptimizerEnabledChange}
                onOptimizerRunsChange={handleOptimizerRunsChange}
              />

              <ContractIdentifier
                selectedLanguage={selectedLanguage}
                selectedMethod={selectedMethod}
                contractIdentifier={contractIdentifier}
                onContractIdentifierChange={handleContractIdentifierChange}
                uploadedFiles={uploadedFiles}
              />


              {/* Submission Result Feedback */}
              {submissionResult && (
                <div
                  className={`p-4 rounded-md ${
                    submissionResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                  }`}
                >
                  {submissionResult.success ? (
                    <div className="text-green-800">
                      <h4 className="font-medium">Verification submitted successfully!</h4>
                      <p className="text-sm mt-1">
                        Job ID:{" "}
                        <code className="bg-green-100 px-2 py-1 rounded text-xs">
                          {submissionResult.verificationId}
                        </code>
                      </p>
                    </div>
                  ) : (
                    <div className="text-red-800">
                      <h4 className="font-medium">Verification failed</h4>
                      <p className="text-sm mt-1">{submissionResult.error}</p>
                    </div>
                  )}
                </div>
              )}

              {!isFrameworkMethod && (
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!isFormValid || isSubmitting}
                    className={`px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:ring-offset-2 transition-colors ${
                      isFormValid && !isSubmitting
                        ? "bg-cerulean-blue-500 text-white hover:bg-cerulean-blue-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                    title={getSubmitButtonTooltip()}
                  >
                    {isSubmitting ? "Submitting..." : "Verify Contract"}
                  </button>
                </div>
              )}
            </form>
          </div>
          <div className="p-8 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Recent Verifications</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">0x1234...5678</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Verified</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">0xabcd...efgh</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending</span>
              </div>
            </div>
          </div>
        </>
      </PageLayout>
    </div>
  );
}
