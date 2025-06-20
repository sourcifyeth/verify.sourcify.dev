import type { Route } from "./+types/jobs.$jobId";
import { useParams } from "react-router";
import { useChains } from "../contexts/ChainsContext";
import { getChainName } from "../utils/chains";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Verification Job - Sourcify" }, { name: "description", content: "View verification job details" }];
}

export default function JobDetails() {
  const { jobId } = useParams<{ jobId: string }>();
  const { chains } = useChains();

  // Dummy job data
  const dummyJob = {
    id: jobId || "job-123",
    contractAddress: "0x1234567890123456789012345678901234567890",
    chainId: 1,
    status: "completed",
    createdAt: "2024-01-15T10:30:00Z",
    completedAt: "2024-01-15T10:35:00Z",
    verificationResult: {
      isVerified: true,
      matchType: "full",
      compilerVersion: "0.8.19",
      optimization: true,
      runs: 200,
    },
    sourceCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleStorage {
    uint256 private value;
    
    event ValueChanged(uint256 newValue);
    
    function setValue(uint256 newValue) public {
        value = newValue;
        emit ValueChanged(newValue);
    }
    
    function getValue() public view returns (uint256) {
        return value;
    }
}`,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <a href="/verify" className="text-cerulean-blue-600 hover:text-cerulean-blue-800 flex items-center">
            ← Back to Verification
          </a>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Verification Job #{dummyJob.id}</h1>
                <p className="text-gray-600 mt-1">{dummyJob.contractAddress}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dummyJob.status)}`}>
                {dummyJob.status.charAt(0).toUpperCase() + dummyJob.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Job Details */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Job Details</h2>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Job ID</dt>
                    <dd className="text-sm text-gray-900">{dummyJob.id}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Network</dt>
                    <dd className="text-sm text-gray-900">{getChainName(chains, dummyJob.chainId)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Chain ID</dt>
                    <dd className="text-sm text-gray-900">{dummyJob.chainId}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="text-sm text-gray-900">{new Date(dummyJob.createdAt).toLocaleString()}</dd>
                  </div>
                  {dummyJob.completedAt && (
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Completed</dt>
                      <dd className="text-sm text-gray-900">{new Date(dummyJob.completedAt).toLocaleString()}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Verification Results</h2>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Verified</dt>
                    <dd className="text-sm text-gray-900">{dummyJob.verificationResult.isVerified ? "Yes" : "No"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Match Type</dt>
                    <dd className="text-sm text-gray-900 capitalize">{dummyJob.verificationResult.matchType}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Compiler Version</dt>
                    <dd className="text-sm text-gray-900">{dummyJob.verificationResult.compilerVersion}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Optimization</dt>
                    <dd className="text-sm text-gray-900">
                      {dummyJob.verificationResult.optimization ? "Enabled" : "Disabled"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Runs</dt>
                    <dd className="text-sm text-gray-900">{dummyJob.verificationResult.runs}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Source Code */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Source Code</h2>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100 font-mono">
                  <code>{dummyJob.sourceCode}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
