import type { Route } from "./+types/home";
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
import RecentVerifications from "../components/verification/RecentVerifications";
import { saveJob } from "../utils/jobStorage";
import React from "react";
import Settings from "../components/verification/Settings";
import ImportFromEtherscan from "../components/verification/ImportFromEtherscan";
import { useServerConfig } from "../contexts/ServerConfigContext";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "verify.sourcify.dev" },
    { name: "description", content: "Verify your smart contracts with Sourcify" },
  ];
}

export default function Home() {
  const { serverUrl } = useServerConfig();
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
    handleImportedData,
    isSubmitting,
    setIsSubmitting,
    submissionResult,
    setSubmissionResult,
  } = useVerificationState();

  const {
    isFormValid,
    updateAddressValidation,
    updateChainId,
    updateLanguage,
    updateMethod,
    updateCompilerVersion,
    getSubmissionErrors,
    isFrameworkMethod,
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

        const { sources, metadata } = await buildMetadataSubmissionSources(metadataFile, uploadedFiles);

        result = await submitMetadataVerification(serverUrl, selectedChainId, contractAddress, sources, metadata);
      } else if (selectedMethod === "std-json") {
        // For std-json method, use the uploaded file directly
        if (uploadedFiles.length === 0) {
          throw new Error("No standard JSON file uploaded");
        }

        result = await submitStdJsonFile(
          serverUrl,
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
          serverUrl,
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

      // Save job to localStorage
      saveJob({
        verificationId: result.verificationId,
        isJobCompleted: false,
        jobStartTime: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        contract: {
          chainId: selectedChainId,
          address: contractAddress,
        },
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
          <div className="px-4 md:px-8 py-4 md:py-6">
            <form className="space-y-6 md:space-y-8" onSubmit={handleSubmit}>
              <Settings />
              <ChainAndAddress
                selectedChainId={selectedChainId}
                contractAddress={contractAddress}
                onChainIdChange={handleChainIdChange}
                onContractAddressChange={handleContractAddressChange}
                chains={chains}
                onValidationChange={updateAddressValidation}
              />

              {/* Import Sources From section */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
                <h3 className="text-lg font-semibold text-gray-900">Import Sources</h3>
                <p className="text-sm text-gray-500 mb-4">
                  You can import the sources and settings from various places to submit a verification on Sourcify.
                </p>
                <div className="flex justify-start space-y-3">
                  <ImportFromEtherscan
                    chainId={selectedChainId}
                    address={contractAddress}
                    onImportSuccess={handleImportedData}
                  />
                </div>
              </div>

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
                        onValidationChange={() => {}}
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
                    <div className="flex flex-col items-center text-green-800">
                      <h3 className="font-medium text-lg">Verification submitted successfully!</h3>
                      <div className="text-sm mt-2">Verification Job ID:</div>
                      <span className="text-sm mt-1 font-mono bg-gray-100 text-gray-900 px-2 py-1 rounded-md">
                        {submissionResult.verificationId}
                      </span>

                      <div className="mt-6">
                        <a
                          href={`/jobs/${submissionResult.verificationId}`}
                          className="inline-flex items-center px-6 py-2 rounded-md text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors shadow-sm"
                        >
                          View Job Status
                        </a>
                      </div>

                      <p className="text-sm mt-3 text-gray-600 text-center">
                        Your verification is being processed. Click above to monitor progress.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center text-red-800">
                      <h3 className="font-medium text-lg">Verification failed</h3>
                      <p className="text-sm mt-1">{submissionResult.error}</p>
                    </div>
                  )}
                </div>
              )}

              {!isFrameworkMethod && (
                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={!isFormValid || isSubmitting}
                    className={`w-full md:w-auto px-8 md:px-12 py-3 text-base md:text-lg rounded-md focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2 min-h-[44px] ${
                      isFormValid && !isSubmitting
                        ? "bg-cerulean-blue-500 text-white hover:bg-cerulean-blue-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                    title={getSubmitButtonTooltip()}
                  >
                    {isSubmitting && (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    )}
                    <span>{isSubmitting ? "Submitting..." : "Verify Contract"}</span>
                  </button>
                </div>
              )}
            </form>
          </div>
          <div className="p-4 md:p-8 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <RecentVerifications />
          </div>
        </>
      </PageLayout>
    </div>
  );
}
