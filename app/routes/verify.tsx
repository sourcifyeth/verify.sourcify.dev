import type { Route } from "./+types/verify";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sourcify Verification" },
    { name: "description", content: "Verify your smart contracts with Sourcify" },
  ];
}

export default function Verify() {
  // Dummy data for verification form
  const dummyNetworks = [
    { id: 1, name: "Ethereum Mainnet", chainId: 1 },
    { id: 5, name: "Goerli Testnet", chainId: 5 },
    { id: 11155111, name: "Sepolia Testnet", chainId: 11155111 },
    { id: 137, name: "Polygon", chainId: 137 },
  ];

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
              <label htmlFor="network" className="block text-sm font-medium text-gray-700 mb-2">
                Network
              </label>
              <select
                id="network"
                name="network"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a network</option>
                {dummyNetworks.map((network) => (
                  <option key={network.id} value={network.chainId}>
                    {network.name}
                  </option>
                ))}
              </select>
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
