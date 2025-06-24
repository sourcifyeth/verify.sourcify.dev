import { useState, useEffect, useCallback } from "react";

interface FormValidationState {
  isAddressValid: boolean;
  selectedChainId: string;
  selectedLanguage: string;
  selectedMethod: string;
  selectedCompilerVersion: string;
}

interface ValidationErrors {
  address?: string;
  chain?: string;
  language?: string;
  method?: string;
  compilerVersion?: string;
}

const FRAMEWORK_METHODS = ["hardhat", "foundry"];

export function useFormValidation() {
  const [validationState, setValidationState] = useState<FormValidationState>({
    isAddressValid: false,
    selectedChainId: "",
    selectedLanguage: "",
    selectedMethod: "",
    selectedCompilerVersion: "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  // Check if selected method is a framework method (not a verification method)
  const isFrameworkMethod = FRAMEWORK_METHODS.includes(validationState.selectedMethod);

  // Check if compiler version is required (not for metadata, hardhat, or foundry methods)
  const isCompilerVersionRequired =
    validationState.selectedLanguage &&
    validationState.selectedMethod &&
    !["metadata-json", "hardhat", "foundry"].includes(validationState.selectedMethod);

  // Calculate overall form validity
  const isFormValid =
    validationState.isAddressValid &&
    validationState.selectedChainId &&
    validationState.selectedLanguage &&
    validationState.selectedMethod &&
    !isFrameworkMethod && // Don't allow submission for framework methods
    (!isCompilerVersionRequired || validationState.selectedCompilerVersion); // Require compiler version when needed

  // Update validation errors based on current state
  useEffect(() => {
    const newErrors: ValidationErrors = {};

    if (!validationState.isAddressValid && validationState.selectedChainId) {
      newErrors.address = "Please enter a valid contract address";
    }

    if (!validationState.selectedChainId) {
      newErrors.chain = "Please select a blockchain network";
    }

    if (!validationState.selectedLanguage) {
      newErrors.language = "Please select a programming language";
    }

    if (validationState.selectedLanguage && !validationState.selectedMethod) {
      newErrors.method = "Please select a verification method";
    }

    if (isFrameworkMethod) {
      newErrors.method = "Please select a verification method (not a framework helper)";
    }

    if (isCompilerVersionRequired && !validationState.selectedCompilerVersion) {
      newErrors.compilerVersion = "Please select a compiler version";
    }

    setErrors(newErrors);
  }, [validationState, isFrameworkMethod, isCompilerVersionRequired]);

  const updateAddressValidation = useCallback((isValid: boolean) => {
    setValidationState((prev) => ({ ...prev, isAddressValid: isValid }));
  }, []);

  const updateChainId = useCallback((chainId: string) => {
    setValidationState((prev) => ({ ...prev, selectedChainId: chainId }));
  }, []);

  const updateLanguage = useCallback((language: string | null) => {
    setValidationState((prev) => ({ ...prev, selectedLanguage: language || "" }));
  }, []);

  const updateMethod = useCallback((method: string) => {
    setValidationState((prev) => ({ ...prev, selectedMethod: method }));
  }, []);

  const updateCompilerVersion = useCallback((version: string) => {
    setValidationState((prev) => ({ ...prev, selectedCompilerVersion: version }));
  }, []);

  const getSubmissionErrors = useCallback((): string[] => {
    const submissionErrors: string[] = [];

    if (!validationState.isAddressValid) {
      submissionErrors.push("Valid contract address is required");
    }
    if (!validationState.selectedChainId) {
      submissionErrors.push("Chain selection is required");
    }
    if (!validationState.selectedLanguage) {
      submissionErrors.push("Language selection is required");
    }
    if (!validationState.selectedMethod) {
      submissionErrors.push("Verification method selection is required");
    }
    if (isFrameworkMethod) {
      submissionErrors.push("Framework helpers cannot be used for verification - please select a verification method");
    }
    if (isCompilerVersionRequired && !validationState.selectedCompilerVersion) {
      submissionErrors.push("Compiler version selection is required");
    }

    return submissionErrors;
  }, [validationState, isFrameworkMethod, isCompilerVersionRequired]);

  return {
    isFormValid,
    errors,
    validationState,
    updateAddressValidation,
    updateChainId,
    updateLanguage,
    updateMethod,
    updateCompilerVersion,
    getSubmissionErrors,
    isFrameworkMethod,
    isCompilerVersionRequired,
  };
}
