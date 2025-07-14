import { useState } from "react";
import type { Language } from "../types/verification";

export function useVerificationState() {
  const [selectedChainId, setSelectedChainId] = useState<string>("");
  const [contractAddress, setContractAddress] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [selectedCompilerVersion, setSelectedCompilerVersion] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [metadataFile, setMetadataFile] = useState<File | null>(null);
  const [evmVersion, setEvmVersion] = useState<string>("default");
  const [optimizerEnabled, setOptimizerEnabled] = useState<boolean>(false);
  const [optimizerRuns, setOptimizerRuns] = useState<number>(200);
  const [contractIdentifier, setContractIdentifier] = useState<string>("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    verificationId?: string;
    error?: string;
  } | null>(null);

  const handleChainIdChange = (value: string) => {
    setSelectedChainId(value);
  };

  const handleContractAddressChange = (value: string) => {
    setContractAddress(value);
  };

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
    setSelectedMethod(""); // Reset method when language changes
    setSelectedCompilerVersion(""); // Reset compiler version when language changes
    setUploadedFiles([]); // Reset files when language changes
    setMetadataFile(null); // Reset metadata file when language changes
    setEvmVersion("default"); // Reset EVM version when language changes
    setOptimizerEnabled(false); // Reset optimizer when language changes
    setOptimizerRuns(200); // Reset optimizer runs when language changes
    setContractIdentifier(""); // Reset contract identifier when language changes
  };

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    setSelectedCompilerVersion(""); // Reset compiler version when method changes
    setUploadedFiles([]); // Reset files when method changes
    setMetadataFile(null); // Reset metadata file when method changes
  };

  const handleCompilerVersionSelect = (version: string) => {
    setSelectedCompilerVersion(version);
  };

  const handleFilesChange = (files: File[]) => {
    setUploadedFiles(files);
  };

  const handleEvmVersionChange = (version: string) => {
    setEvmVersion(version);
  };

  const handleOptimizerEnabledChange = (enabled: boolean) => {
    setOptimizerEnabled(enabled);
  };

  const handleOptimizerRunsChange = (runs: number) => {
    setOptimizerRuns(runs);
  };

  const handleContractIdentifierChange = (identifier: string) => {
    setContractIdentifier(identifier);
  };

  const handleMetadataFileChange = (files: (File | null)[]) => {
    if (files.length > 0) {
      setMetadataFile(files[0]);
    } else {
      setMetadataFile(null);
    }
  };

  const handleImportedData = (data: {
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
  }) => {
    // Set language and method
    setSelectedLanguage(data.language as Language);
    setSelectedMethod(data.verificationMethod);
    
    // Set compiler version
    setSelectedCompilerVersion(data.compilerVersion);
    
    // Set files
    setUploadedFiles(data.files);
    setMetadataFile(null); // Clear metadata file when importing
    
    // Set compiler settings
    setEvmVersion(data.compilerSettings.evmVersion);
    setOptimizerEnabled(data.compilerSettings.optimizerEnabled);
    setOptimizerRuns(data.compilerSettings.optimizerRuns);
    
    // Set contract identifier (use contract name as default)
    setContractIdentifier(data.contractName);
  };

  return {
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
  };
}
