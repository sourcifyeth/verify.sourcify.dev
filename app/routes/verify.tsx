import type { Route } from "./+types/verify";
import { useChains } from "../contexts/ChainsContext";
import { useState } from "react";
import ChainSelect from "../components/ChainSelect";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sourcify Verification" },
    { name: "description", content: "Verify your smart contracts with Sourcify" },
  ];
}

export default function Verify() {
  const { chains, loading, error, refetch } = useChains();
  const [selectedChainId, setSelectedChainId] = useState<string>("");

  const handleChainIdChange = (value: string) => {
    setSelectedChainId(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading supported networks...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <div className="text-center">
              <div className="text-red-600 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load networks</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={refetch}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sourcify Verification</h1>
            <p className="text-gray-600">Verify your smart contracts on supported networks</p>
          </div>

          <form className="space-y-6">
            <div>
              <label htmlFor="contractAddress" className="block text-sm font-medium text-gray-700 mb-2">
                Contract Address
              </label>
              <input
                type="text"
                id="contractAddress"
                name="contractAddress"
                placeholder="0x..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="chain" className="block text-sm font-medium text-gray-700 mb-2">
                Chain
              </label>
              <ChainSelect
                value={selectedChainId}
                handleChainIdChange={handleChainIdChange}
                chains={chains}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="sourceCode" className="block text-sm font-medium text-gray-700 mb-2">
                Source Code (Optional)
              </label>
              <textarea
                id="sourceCode"
                name="sourceCode"
                rows={6}
                placeholder="Paste your contract source code here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Verify Contract
              </button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-gray-50 rounded-md">
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
        </div>
      </div>
    </div>
  );
}
