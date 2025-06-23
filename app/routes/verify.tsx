import type { Route } from "./+types/verify";
import { useChains } from "../contexts/ChainsContext";
import { useState } from "react";
import ChainSelect from "../components/ChainSelect";
import PageLayout from "../components/PageLayout";
import { Tooltip as ReactTooltip } from "react-tooltip";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sourcify Verification" },
    { name: "description", content: "Verify your smart contracts with Sourcify" },
  ];
}

export default function Verify() {
  const { chains } = useChains();
  const [selectedChainId, setSelectedChainId] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<string>("");

  const handleChainIdChange = (value: string) => {
    setSelectedChainId(value);
  };

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setSelectedMethod(""); // Reset method when language changes
  };

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
  };

  const flatteningWarning = (
    <span>
      Flattenning or modifying sources will change the metadata hash and will break{" "}
      <a
        href="https://docs.sourcify.dev/docs/exact-match-vs-match/"
        className="text-cerulean-blue-600 hover:text-cerulean-blue-700 underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        Exact Matches
      </a>
      . Always prefer standard JSON, metadata.json, or using the built-in verification commands in frameworks like
      Hardhat or Foundry.
    </span>
  );

  const baseVerificationMethods = [
    {
      id: "single-file",
      title: "Single File",
      description: "Upload a single file or flattened sources",
      warning: flatteningWarning,
    },
    {
      id: "multiple-files",
      title: "Multiple Files",
      description: "Upload multiple files",
      warning: flatteningWarning,
    },
    {
      id: "std-json",
      title: "Std JSON",
      description: "Use standard JSON input format",
    },
  ];

  const frameworkMethods = [
    {
      id: "hardhat",
      title: "Hardhat",
      description: "Use Hardhat's built-in verification",
      icon: "/hardhat.png",
    },
    {
      id: "foundry",
      title: "Foundry",
      description: "Use Foundry's built-in verification",
      icon: "/foundry.png",
    },
  ];

  const solidityMetadataMethod = {
    id: "metadata-json",
    title: "Metadata.json",
    description: "Use Solidity's metadata.json output file",
    warning:
      "The metadata.json method will actually generate the std JSON behind the scenes when compiling, using the metadata JSON as input.",
  };

  const verificationMethods = {
    solidity: [...baseVerificationMethods, solidityMetadataMethod],
    vyper: baseVerificationMethods,
  };

  const frameworkMessages = {
    hardhat: "Use the Hardhat plugin for Sourcify verification. Run: npm install --save-dev @sourcify/hardhat-plugin",
    foundry: "Use the Foundry plugin for Sourcify verification. Add to foundry.toml: sourcify = true",
  };

  return (
    <div className="pb-12 bg-cerulean-blue-50 pt-1">
      <PageLayout title="Verify Smart Contracts">
        <>
          <div className="p-8">
            <form className="space-y-6">
              <div>
                <label htmlFor="contractAddress" className="block text-base font-semibold text-gray-900 mb-2">
                  Contract Address
                </label>
                <input
                  type="text"
                  id="contractAddress"
                  name="contractAddress"
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:border-cerulean-blue-500"
                />
              </div>

              <div>
                <label htmlFor="chain" className="block text-base font-semibold text-gray-900 mb-2">
                  Chain
                </label>
                <ChainSelect
                  value={selectedChainId}
                  handleChainIdChange={handleChainIdChange}
                  chains={chains}
                  className="w-full"
                />
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-2">Language</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => handleLanguageSelect("solidity")}
                    className={`w-32 p-4 border-2 rounded-lg text-center transition-all duration-200 cursor-pointer ${
                      selectedLanguage === "solidity"
                        ? "border-cerulean-blue-500 bg-cerulean-blue-50"
                        : "border-gray-300 hover:border-cerulean-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <img src="/solidity.svg" alt="Solidity" className="mx-auto w-8 h-8 mb-2" />
                    <h3
                      className={`text-sm font-medium ${
                        selectedLanguage === "solidity" ? "text-cerulean-blue-600" : "text-gray-700"
                      }`}
                    >
                      Solidity
                    </h3>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLanguageSelect("vyper")}
                    className={`w-32 p-4 border-2 rounded-lg text-center transition-all duration-200 cursor-pointer ${
                      selectedLanguage === "vyper"
                        ? "border-cerulean-blue-500 bg-cerulean-blue-50"
                        : "border-gray-300 hover:border-cerulean-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <img src="/vyper.svg" alt="Vyper" className="mx-auto w-8 h-8 mb-2" />
                    <h3
                      className={`text-sm font-medium ${
                        selectedLanguage === "vyper" ? "text-cerulean-blue-600" : "text-gray-700"
                      }`}
                    >
                      Vyper
                    </h3>
                  </button>
                </div>
              </div>

              {/* Verification Method Selection */}
              {selectedLanguage && (
                <div>
                  <label className="block text-base font-semibold text-gray-900 mb-2">Verification Method</label>
                  <div className="flex flex-wrap gap-4">
                    {verificationMethods[selectedLanguage as keyof typeof verificationMethods]?.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => handleMethodSelect(method.id)}
                        className={`relative flex flex-col items-center p-3 border-2 rounded-lg text-center transition-all duration-200 cursor-pointer w-36 ${
                          selectedMethod === method.id
                            ? "border-cerulean-blue-500 bg-cerulean-blue-50"
                            : "border-gray-300 hover:border-cerulean-blue-300 hover:bg-gray-50"
                        }`}
                      >
                        {method.id === "std-json" && (
                          <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full shadow-sm">
                            Preferred
                          </span>
                        )}
                        {method.id === "metadata-json" && (
                          <>
                            <button
                              type="button"
                              data-tooltip-id="metadata-json-tooltip"
                              data-tooltip-content="Click to learn more"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open("https://docs.soliditylang.org/en/latest/metadata.html", "_blank");
                              }}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 rounded-full flex items-center justify-center text-xs font-medium transition-colors duration-200 shadow-sm cursor-pointer"
                            >
                              ?
                            </button>
                            <ReactTooltip id="metadata-json-tooltip" place="top" />
                          </>
                        )}
                        <h3
                          className={`text-base font-medium mb-1 ${
                            selectedMethod === method.id ? "text-cerulean-blue-600" : "text-gray-700"
                          }`}
                        >
                          {method.title}
                        </h3>
                        <p className="text-xs text-gray-600">{method.description}</p>
                      </button>
                    ))}
                  </div>

                  {/* Framework Methods */}
                  <div className="flex gap-4 mt-4">
                    {frameworkMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => handleMethodSelect(method.id)}
                        className={`relative flex items-center justify-center gap-2 p-3 border-2 rounded-lg text-center transition-all duration-200 cursor-pointer w-36 ${
                          selectedMethod === method.id
                            ? "border-cerulean-blue-500 bg-cerulean-blue-50"
                            : "border-gray-300 hover:border-cerulean-blue-300 hover:bg-gray-50"
                        }`}
                      >
                        <img src={method.icon} alt={method.title} className="w-6 h-6" />
                        <h3
                          className={`text-base font-medium ${
                            selectedMethod === method.id ? "text-cerulean-blue-600" : "text-gray-700"
                          }`}
                        >
                          {method.title}
                        </h3>
                      </button>
                    ))}
                  </div>

                  {/* Show warning for selected method */}
                  {selectedMethod &&
                    verificationMethods[selectedLanguage as keyof typeof verificationMethods]?.find(
                      (m) => m.id === selectedMethod
                    )?.warning && (
                      <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-sm rounded">
                        {
                          verificationMethods[selectedLanguage as keyof typeof verificationMethods]?.find(
                            (m) => m.id === selectedMethod
                          )?.warning
                        }
                      </div>
                    )}

                  {/* Show framework message for selected framework */}
                  {selectedMethod && frameworkMessages[selectedMethod as keyof typeof frameworkMessages] && (
                    <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-800 text-sm rounded">
                      {frameworkMessages[selectedMethod as keyof typeof frameworkMessages]}
                    </div>
                  )}
                </div>
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
