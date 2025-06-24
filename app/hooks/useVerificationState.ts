import { useState } from "react";
import type { Language } from "../types/verification";

export function useVerificationState() {
  const [selectedChainId, setSelectedChainId] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [selectedCompilerVersion, setSelectedCompilerVersion] = useState<string>("");

  const handleChainIdChange = (value: string) => {
    setSelectedChainId(value);
  };

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
    setSelectedMethod(""); // Reset method when language changes
    setSelectedCompilerVersion(""); // Reset compiler version when language changes
  };

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    setSelectedCompilerVersion(""); // Reset compiler version when method changes
  };

  const handleCompilerVersionSelect = (version: string) => {
    setSelectedCompilerVersion(version);
  };

  return {
    selectedChainId,
    selectedLanguage,
    selectedMethod,
    selectedCompilerVersion,
    handleChainIdChange,
    handleLanguageSelect,
    handleMethodSelect,
    handleCompilerVersionSelect,
  };
}
