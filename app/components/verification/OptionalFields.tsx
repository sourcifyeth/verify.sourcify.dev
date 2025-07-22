import React, { useState } from "react";
import CreationTransactionHash from "./CreationTransactionHash";

interface OptionalFieldsProps {
  creationTransactionHash: string;
  onCreationTransactionHashChange: (hash: string) => void;
}

export default function OptionalFields({
  creationTransactionHash,
  onCreationTransactionHashChange,
}: OptionalFieldsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full p-4 text-left text-base font-semibold text-gray-900 hover:text-cerulean-blue-600 hover:bg-gray-50 transition-colors rounded-lg"
      >
        <span>Optional Fields</span>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200">
          <div className="pt-4">
            <CreationTransactionHash
              creationTransactionHash={creationTransactionHash}
              onCreationTransactionHashChange={onCreationTransactionHashChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}