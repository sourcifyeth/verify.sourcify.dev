import { useMemo, useCallback } from "react";
import type { Language } from "../types/verification";

interface ValidationParams {
  isAddressValid: boolean;
  selectedChainId: string;
  contractAddress: string;
  selectedLanguage: Language | null;
  selectedMethod: string;
  selectedCompilerVersion: string;
  contractIdentifier: string;
  uploadedFiles: File[];
  metadataFile: File | null;
}

interface ValidationErrors {
  address?: string;
  chain?: string;
  language?: string;
  method?: string;
  compilerVersion?: string;
  contractIdentifier?: string;
  files?: string;
}

const FRAMEWORK_METHODS = ["hardhat", "foundry"];

export function useFormValidation({
  isAddressValid,
  selectedChainId,
  contractAddress,
  selectedLanguage,
  selectedMethod,
  selectedCompilerVersion,
  contractIdentifier,
  uploadedFiles,
  metadataFile,
}: ValidationParams) {
  // Convert selectedLanguage to string for consistency
  const languageString = selectedLanguage || "";

  // Check if selected method is a framework method (not a verification method)
  const isFrameworkMethod = FRAMEWORK_METHODS.includes(selectedMethod);

  // Check if compiler version is required (not for metadata, hardhat, or foundry methods)
  const isCompilerVersionRequired =
    languageString && selectedMethod && !["metadata-json", "hardhat", "foundry"].includes(selectedMethod);

  // Check if contract identifier is required (not for metadata-json, hardhat, or foundry methods)
  const isContractIdentifierRequired =
    languageString && selectedMethod && !["metadata-json", "hardhat", "foundry"].includes(selectedMethod);

  // Check if files are required based on the selected method
  const areFilesRequired = languageString && selectedMethod && !["hardhat", "foundry"].includes(selectedMethod);
  
  const validateFiles = () => {
    if (!areFilesRequired) return true;
    
    if (selectedMethod === "metadata-json") {
      // metadata-json requires both metadata file and source files
      return metadataFile !== null && uploadedFiles.length > 0;
    } else if (["single-file", "multiple-files", "std-json"].includes(selectedMethod)) {
      // Other methods require uploaded files
      return uploadedFiles.length > 0;
    }
    
    return true;
  };

  // Calculate validation errors based on passed values
  const errors = useMemo(() => {
    const newErrors: ValidationErrors = {};

    if (!isAddressValid) {
      newErrors.address = "Please enter a valid contract address";
    }

    if (!selectedChainId) {
      newErrors.chain = "Please select a chain";
    }

    if (!languageString) {
      newErrors.language = "Please select a contract language";
    }

    if (languageString && !selectedMethod) {
      newErrors.method = "Please select a verification method";
    }

    if (isFrameworkMethod) {
      newErrors.method = "Please select a verification method (not a framework helper)";
    }

    if (isCompilerVersionRequired && !selectedCompilerVersion) {
      newErrors.compilerVersion = "Please select a compiler version";
    }

    if (isContractIdentifierRequired && !contractIdentifier) {
      newErrors.contractIdentifier = "Please provide a contract identifier";
    }

    // File validation
    if (areFilesRequired && !validateFiles()) {
      if (selectedMethod === "metadata-json") {
        if (!metadataFile && uploadedFiles.length === 0) {
          newErrors.files = "Please upload metadata.json and source files";
        } else if (!metadataFile) {
          newErrors.files = "Please upload metadata.json file";
        } else if (uploadedFiles.length === 0) {
          newErrors.files = "Please upload source files";
        }
      } else if (selectedMethod === "std-json") {
        newErrors.files = "Please upload standard JSON file";
      } else if (selectedMethod === "single-file") {
        newErrors.files = "Please upload contract file";
      } else if (selectedMethod === "multiple-files") {
        newErrors.files = "Please upload contract files";
      }
    }

    return newErrors;
  }, [
    isAddressValid,
    selectedChainId,
    languageString,
    selectedMethod,
    selectedCompilerVersion,
    contractIdentifier,
    isFrameworkMethod,
    isCompilerVersionRequired,
    isContractIdentifierRequired,
    areFilesRequired,
    metadataFile,
    uploadedFiles,
  ]);

  // Calculate overall form validity
  const isFormValid =
    isAddressValid &&
    selectedChainId &&
    languageString &&
    selectedMethod &&
    !isFrameworkMethod && // Don't allow submission for framework methods
    (!isCompilerVersionRequired || selectedCompilerVersion) && // Require compiler version when needed
    (!isContractIdentifierRequired || contractIdentifier) && // Require contract identifier when needed
    (!areFilesRequired || validateFiles()); // Require files when needed

  const getSubmissionErrors = useCallback((): string[] => {
    const submissionErrors: string[] = [];

    if (!isAddressValid) {
      submissionErrors.push("Valid contract address is required");
    }
    if (!selectedChainId) {
      submissionErrors.push("Chain selection is required");
    }
    if (!languageString) {
      submissionErrors.push("Language selection is required");
    }
    if (!selectedMethod) {
      submissionErrors.push("Verification method selection is required");
    }
    if (isFrameworkMethod) {
      submissionErrors.push("Framework helpers cannot be used for verification - please select a verification method");
    }
    if (isCompilerVersionRequired && !selectedCompilerVersion) {
      submissionErrors.push("Compiler version selection is required");
    }
    if (isContractIdentifierRequired && !contractIdentifier) {
      submissionErrors.push("Contract identifier is required");
    }
    if (areFilesRequired && !validateFiles()) {
      submissionErrors.push("Required files are missing");
    }

    return submissionErrors;
  }, [
    isAddressValid,
    selectedChainId,
    languageString,
    selectedMethod,
    isFrameworkMethod,
    isCompilerVersionRequired,
    selectedCompilerVersion,
    isContractIdentifierRequired,
    contractIdentifier,
    areFilesRequired,
    metadataFile,
    uploadedFiles,
  ]);

  return {
    isFormValid,
    errors,
    getSubmissionErrors,
    isFrameworkMethod,
    isCompilerVersionRequired,
    isContractIdentifierRequired,
  };
}
