import { useState } from "react";
import type { Language } from "../types/verification";

export function useVerificationState() {
  const [selectedChainId, setSelectedChainId] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [selectedCompilerVersion, setSelectedCompilerVersion] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleChainIdChange = (value: string) => {
    setSelectedChainId(value);
  };

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
    setSelectedMethod(""); // Reset method when language changes
    setSelectedCompilerVersion(""); // Reset compiler version when language changes
    setUploadedFiles([]); // Reset files when language changes
  };

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    setSelectedCompilerVersion(""); // Reset compiler version when method changes
    setUploadedFiles([]); // Reset files when method changes
  };

  const handleCompilerVersionSelect = (version: string) => {
    setSelectedCompilerVersion(version);
  };

  const handleFilesChange = (files: File[]) => {
    setUploadedFiles(files);
  };

  return {
    selectedChainId,
    selectedLanguage,
    selectedMethod,
    selectedCompilerVersion,
    uploadedFiles,
    handleChainIdChange,
    handleLanguageSelect,
    handleMethodSelect,
    handleCompilerVersionSelect,
    handleFilesChange,
  };
}
