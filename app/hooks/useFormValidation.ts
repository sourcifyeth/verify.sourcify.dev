import { useState, useEffect } from "react";

interface FormValidationState {
  isAddressValid: boolean;
  selectedChainId: string;
  selectedLanguage: string;
  selectedMethod: string;
}

interface ValidationErrors {
  address?: string;
  chain?: string;
  language?: string;
  method?: string;
}

const FRAMEWORK_METHODS = ["hardhat", "foundry"];

export function useFormValidation() {
  const [validationState, setValidationState] = useState<FormValidationState>({
    isAddressValid: false,
    selectedChainId: "",
    selectedLanguage: "",
    selectedMethod: "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  // Check if selected method is a framework method (not a verification method)
  const isFrameworkMethod = FRAMEWORK_METHODS.includes(validationState.selectedMethod);

  // Calculate overall form validity
  const isFormValid =
    validationState.isAddressValid &&
    validationState.selectedChainId &&
    validationState.selectedLanguage &&
    validationState.selectedMethod &&
    !isFrameworkMethod; // Don't allow submission for framework methods

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

    setErrors(newErrors);
  }, [validationState, isFrameworkMethod]);

  const updateAddressValidation = (isValid: boolean) => {
    setValidationState((prev) => ({ ...prev, isAddressValid: isValid }));
  };

  const updateChainId = (chainId: string) => {
    setValidationState((prev) => ({ ...prev, selectedChainId: chainId }));
  };

  const updateLanguage = (language: string) => {
    setValidationState((prev) => ({ ...prev, selectedLanguage: language }));
  };

  const updateMethod = (method: string) => {
    setValidationState((prev) => ({ ...prev, selectedMethod: method }));
  };

  const getSubmissionErrors = (): string[] => {
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

    return submissionErrors;
  };

  return {
    isFormValid,
    errors,
    validationState,
    updateAddressValidation,
    updateChainId,
    updateLanguage,
    updateMethod,
    getSubmissionErrors,
    isFrameworkMethod,
  };
}
