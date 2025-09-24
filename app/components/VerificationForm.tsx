import { useChains } from "../contexts/ChainsContext";
import { useVerificationState } from "../hooks/useVerificationState";
import { useFormValidation } from "../hooks/useFormValidation";
import LanguageSelector from "./verification/LanguageSelector";
import VerificationMethodSelector from "./verification/VerificationMethodSelector";
import ChainAndAddress from "./verification/ChainAndAddress";
import CompilerSelector from "./verification/CompilerSelector";
import LicenseInfo from "./verification/LicenseInfo";
import FileUpload from "./verification/FileUpload";
import CompilerSettings from "./verification/CompilerSettings";
import ContractIdentifier from "./verification/ContractIdentifier";
import OptionalFields from "./verification/OptionalFields";
import { frameworkMethods } from "../data/verificationMethods";
import type { VerificationMethod } from "../types/verification";
import { assembleAndSubmitStandardJson, submitStdJsonFile, submitMetadataVerification } from "../utils/sourcifyApi";
import { buildMetadataSubmissionSources } from "../utils/metadataValidation";
import { parseBuildInfoFile } from "../utils/buildInfoValidation";
import { useCompilerVersions } from "../contexts/CompilerVersionsContext";
import MetadataValidation from "./verification/MetadataValidation";
import { saveJob } from "../utils/jobStorage";
import React from "react";
import Settings from "./verification/Settings";
import ImportSources from "./verification/ImportSources";
import SubmissionResultDisplay from "./verification/SubmissionResultDisplay";
import { useServerConfig } from "../contexts/ServerConfigContext";
import { IoSettings } from "react-icons/io5";

export default function VerificationForm() {
  const { serverUrl } = useServerConfig();
  const { chains } = useChains();
  const { solidityVersions, vyperVersions } = useCompilerVersions();
  const [importError, setImportError] = React.useState<string | null>(null);
  const [importSuccess, setImportSuccess] = React.useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [isAddressValid, setIsAddressValid] = React.useState(false);
  const [lastSubmittedValues, setLastSubmittedValues] = React.useState<string | null>(null);
  const [buildInfoError, setBuildInfoError] = React.useState<string | null>(null);

  // Clear success message after 3 seconds
  React.useEffect(() => {
    if (importSuccess) {
      const timer = setTimeout(() => setImportSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [importSuccess]);

  // Handle import error and clear any existing success
  const handleImportError = (error: string) => {
    setImportSuccess(null);
    setImportError(error);
  };

  // Handle build-info file change (now integrated with regular file handling)
  const handleBuildInfoFileChange = async (files: File[]) => {
    setBuildInfoError(null);

    if (files.length === 0) {
      handleFilesChange([]);
      return;
    }

    try {
      const file = files[0];
      const content = await file.text();
      const availableVersions = selectedLanguage === 'vyper' ? vyperVersions : solidityVersions;
      const parseResult = parseBuildInfoFile(content, availableVersions);

      if (!parseResult.isValid) {
        setBuildInfoError(parseResult.error || 'Invalid build-info file');
        handleFilesChange([]);
        return;
      }

      // Auto-populate compiler version if available
      if (parseResult.compilerVersion) {
        handleCompilerVersionSelect(parseResult.compilerVersion);
      }

      // Create a std-json file from the parsed build-info and store in regular uploadedFiles
      if (parseResult.standardJson) {
        const standardJsonContent = JSON.stringify(parseResult.standardJson, null, 2);
        const stdJsonFile = new File([standardJsonContent], 'build-info.json', { type: 'application/json' });
        handleFilesChange([stdJsonFile]);
      }

    } catch (error) {
      setBuildInfoError('Error processing build-info file');
      handleFilesChange([]);
      console.error('Build-info processing error:', error);
    }
  };

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
    creationTransactionHash,
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
    handleCreationTransactionHashChange,
    isSubmitting,
    setIsSubmitting,
    submissionResult,
    setSubmissionResult,
  } = useVerificationState();

  // Check if selected method is a framework method
  const isFrameworkMethod = frameworkMethods.some(method => method.id === selectedMethod);

  const { isFormValid, errors, getSubmissionErrors } = useFormValidation({
    isAddressValid,
    selectedChainId,
    contractAddress,
    selectedLanguage,
    selectedMethod,
    selectedCompilerVersion,
    contractIdentifier,
    uploadedFiles,
    metadataFile,
    evmVersion,
  });

  // Create a hash of current form values to detect changes
  const currentFormHash = React.useMemo(() => {
    const formValues = {
      selectedChainId,
      contractAddress,
      selectedLanguage,
      selectedMethod,
      selectedCompilerVersion,
      contractIdentifier,
      evmVersion,
      uploadedFileNames: uploadedFiles.map((f) => f.name + f.size).join(","),
      metadataFileName: metadataFile ? metadataFile.name + metadataFile.size : "",
    };
    return JSON.stringify(formValues);
  }, [
    selectedChainId,
    contractAddress,
    selectedLanguage,
    selectedMethod,
    selectedCompilerVersion,
    contractIdentifier,
    evmVersion,
    uploadedFiles,
    metadataFile,
  ]);

  // Clear success messages when form values change
  React.useEffect(() => {
    const hasFormChanged = lastSubmittedValues !== currentFormHash;
    if (lastSubmittedValues && hasFormChanged) {
      // Clear submission success result
      if (submissionResult?.success) {
        setSubmissionResult(null);
      }
      // Clear import success message
      if (importSuccess) {
        setImportSuccess(null);
      }
    }
  }, [currentFormHash, lastSubmittedValues, submissionResult?.success, importSuccess, setSubmissionResult]);

  // Check if current form values are the same as last submitted values
  const hasFormChanged = lastSubmittedValues !== currentFormHash;
  const canSubmit = isFormValid && hasFormChanged && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      if (!isFormValid) {
        const submissionErrors = getSubmissionErrors();
        console.log("Form submission blocked. Missing:", submissionErrors);
      } else if (!hasFormChanged) {
        console.log("Form submission blocked. No changes since last submission.");
      }
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

        result = await submitMetadataVerification(
          serverUrl,
          selectedChainId,
          contractAddress,
          sources,
          metadata,
          creationTransactionHash || undefined
        );
      } else if (selectedMethod === "std-json" || selectedMethod === "build-info") {
        // For std-json method or build-info method, use the uploaded file directly
        if (uploadedFiles.length === 0) {
          const fileType = selectedMethod === "build-info" ? "build-info" : "standard JSON";
          throw new Error(`No ${fileType} file uploaded`);
        }

        result = await submitStdJsonFile(
          serverUrl,
          selectedChainId,
          contractAddress,
          uploadedFiles[0],
          selectedCompilerVersion,
          contractIdentifier,
          creationTransactionHash || undefined
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
          },
          creationTransactionHash || undefined
        );
      }

      setSubmissionResult({
        success: true,
        verificationId: result.verificationId,
      });

      // Store current form values hash to prevent duplicate submissions
      setLastSubmittedValues(currentFormHash);

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
    if (!hasFormChanged) {
      return "No changes since last submission";
    }
    return "Submit verification";
  };

  return (
    <>
      <div className="px-4 md:px-8 py-2 md:py-4">
        {/* Settings Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center space-x-1 md:space-x-2 py-1 md:py-2 px-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <IoSettings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>

        <form className="space-y-6 md:space-y-8 mb-6" onSubmit={handleSubmit}>
          <ChainAndAddress
            selectedChainId={selectedChainId}
            contractAddress={contractAddress}
            onChainIdChange={handleChainIdChange}
            onContractAddressChange={handleContractAddressChange}
            chains={chains}
            onValidationChange={setIsAddressValid}
          />

          <ImportSources
            selectedChainId={selectedChainId}
            contractAddress={contractAddress}
            setIsSubmitting={setIsSubmitting}
            setSubmissionResult={setSubmissionResult}
            submissionResult={submissionResult}
            importError={importError}
            importSuccess={importSuccess}
            onImportError={handleImportError}
            onImportSuccess={setImportSuccess}
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

          {buildInfoError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{buildInfoError}</p>
            </div>
          )}

          {!isFrameworkMethod && !!selectedMethod && (
            <>
              <FileUpload
                selectedMethod={selectedMethod as VerificationMethod}
                selectedLanguage={selectedLanguage}
                onFilesChange={
                  selectedMethod === "metadata-json"
                    ? handleMetadataFileChange
                    : selectedMethod === "build-info"
                    ? handleBuildInfoFileChange
                    : handleFilesChange
                }
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
            selectedMethod={selectedMethod}
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
          {!isFrameworkMethod && !!selectedMethod && (
            <OptionalFields
              creationTransactionHash={creationTransactionHash}
              onCreationTransactionHashChange={handleCreationTransactionHashChange}
            />
          )}

          {/* Submission Result Feedback */}
          {submissionResult && !submissionResult.isEtherscanSubmission && (
            <SubmissionResultDisplay
              submissionResult={submissionResult}
              showCloseButton={true}
              onClose={() => setSubmissionResult(null)}
            />
          )}

          {!isFrameworkMethod && (
            <>
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`w-full md:w-auto px-8 md:px-12 py-3 text-base md:text-lg rounded-md focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2 min-h-[44px] ${
                    canSubmit
                      ? "bg-cerulean-blue-500 text-white hover:bg-cerulean-blue-600"
                      : "bg-gray-300 text-gray-500 !cursor-not-allowed"
                  }`}
                  title={getSubmitButtonTooltip()}
                >
                  {isSubmitting && (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  )}
                  <span>{isSubmitting ? "Submitting..." : "Verify Contract"}</span>
                </button>
              </div>

              {/* Validation Errors List */}
              {!isFormValid && Object.keys(errors).length > 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="text-sm font-medium text-red-800 mb-2">Please complete the following fields:</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    {errors.chain && <li>• {errors.chain}</li>}
                    {errors.address && <li>• {errors.address}</li>}
                    {errors.language && <li>• {errors.language}</li>}
                    {errors.method && <li>• {errors.method}</li>}
                    {errors.files && <li>• {errors.files}</li>}
                    {errors.compilerVersion && <li>• {errors.compilerVersion}</li>}
                    {errors.evmVersion && <li>• {errors.evmVersion}</li>}
                    {errors.contractIdentifier && <li>• {errors.contractIdentifier}</li>}
                  </ul>
                </div>
              )}
            </>
          )}
        </form>
      </div>

      {/* Settings Modal */}
      <Settings isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    </>
  );
}