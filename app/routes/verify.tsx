import type { Route } from "./+types/verify";
import { useChains } from "../contexts/ChainsContext";
import PageLayout from "../components/PageLayout";
import { useVerificationState } from "../hooks/useVerificationState";
import LanguageSelector from "../components/verification/LanguageSelector";
import VerificationMethodSelector from "../components/verification/VerificationMethodSelector";
import VerificationForm from "../components/verification/VerificationForm";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sourcify Verification" },
    { name: "description", content: "Verify your smart contracts with Sourcify" },
  ];
}

export default function Verify() {
  const { chains } = useChains();
  const {
    selectedChainId,
    selectedLanguage,
    selectedMethod,
    handleChainIdChange,
    handleLanguageSelect,
    handleMethodSelect,
  } = useVerificationState();

  return (
    <div className="pb-12 bg-cerulean-blue-50 pt-1">
      <PageLayout title="Verify Smart Contracts">
        <>
          <div className="p-8">
            <form className="space-y-6">
              <VerificationForm
                selectedChainId={selectedChainId}
                onChainIdChange={handleChainIdChange}
                chains={chains}
              />

              <LanguageSelector selectedLanguage={selectedLanguage} onLanguageSelect={handleLanguageSelect} />

              {selectedLanguage && (
                <VerificationMethodSelector
                  selectedLanguage={selectedLanguage}
                  selectedMethod={selectedMethod}
                  onMethodSelect={handleMethodSelect}
                />
              )}

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

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-cerulean-blue-500 text-white px-6 py-2 rounded-md hover:bg-cerulean-blue-600 focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:ring-offset-2"
                >
                  Verify Contract
                </button>
              </div>
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
