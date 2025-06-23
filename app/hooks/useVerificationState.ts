import { useState } from "react";
import type { Language } from "../types/verification";

export function useVerificationState() {
  const [selectedChainId, setSelectedChainId] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<Language | "">("");
  const [selectedMethod, setSelectedMethod] = useState<string>("");

  const handleChainIdChange = (value: string) => {
    setSelectedChainId(value);
  };

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
    setSelectedMethod(""); // Reset method when language changes
  };

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
  };

  return {
    selectedChainId,
    selectedLanguage,
    selectedMethod,
    handleChainIdChange,
    handleLanguageSelect,
    handleMethodSelect,
  };
}
