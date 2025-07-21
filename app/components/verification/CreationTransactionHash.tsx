import React from "react";

interface CreationTransactionHashProps {
  creationTransactionHash: string;
  onCreationTransactionHashChange: (hash: string) => void;
}

export default function CreationTransactionHash({
  creationTransactionHash,
  onCreationTransactionHashChange,
}: CreationTransactionHashProps) {
  return (
    <div>
      <label className="block text-base font-semibold text-gray-900 mb-1">
        Creation Transaction Hash
      </label>
      <p className="text-sm text-gray-600 mb-2">
        The transaction on which the contract was deployed. If not provided, Sourcify will try to find the transaction
        by itself.
      </p>
      <input
        type="text"
        value={creationTransactionHash}
        onChange={(e) => onCreationTransactionHashChange(e.target.value)}
        placeholder="0x1a2b3c4d5e6f..."
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:border-cerulean-blue-500 font-mono text-sm"
      />
    </div>
  );
}
