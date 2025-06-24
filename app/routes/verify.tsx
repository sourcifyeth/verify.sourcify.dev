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
import { verificationMethods, frameworkMethods } from "../data/verificationMethods";
import React from "react";

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
    selectedLanguage,
    selectedMethod,
    selectedCompilerVersion,
    handleChainIdChange,
    handleLanguageSelect,
    handleMethodSelect,
    handleCompilerVersionSelect,
  } = useVerificationState();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      const submissionErrors = getSubmissionErrors();
      console.log("Form submission blocked. Missing:", submissionErrors);
      // You could show a toast or alert here with the errors
      return;
    }

    // Handle form submission here
    console.log("Form submitted successfully with all required fields");
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
              <ChainAndAddress
                selectedChainId={selectedChainId}
                onChainIdChange={handleChainIdChange}
                chains={chains}
                onValidationChange={updateAddressValidation}
              />

              <LanguageSelector selectedLanguage={selectedLanguage} onLanguageSelect={handleLanguageSelect} />

              {selectedLanguage && (
                <VerificationMethodSelector
                  selectedLanguage={selectedLanguage}
                  selectedMethod={selectedMethod}
                  onMethodSelect={handleMethodSelect}
                />
              )}

              <CompilerSelector
                language={selectedLanguage}
                verificationMethod={getSelectedMethodObject()}
                selectedVersion={selectedCompilerVersion}
                onVersionSelect={handleCompilerVersionSelect}
              />

              {!isFrameworkMethod && !!selectedMethod && <LicenseInfo />}

              {!isFrameworkMethod && (
                <div>
                  <label htmlFor="sourceCode" className="block text-base font-semibold text-gray-900 mb-2">
                    Source Code (Optional)
                  </label>
                  <textarea
                    id="sourceCode"
                    name="sourceCode"
                    rows={6}
                    placeholder="Paste your contract source code here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:border-cerulean-blue-500"
                  />
                </div>
              )}

              {!isFrameworkMethod && (
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!isFormValid}
                    className={`px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:ring-offset-2 transition-colors ${
                      isFormValid
                        ? "bg-cerulean-blue-500 text-white hover:bg-cerulean-blue-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                    title={getSubmitButtonTooltip()}
                  >
                    Verify Contract
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
