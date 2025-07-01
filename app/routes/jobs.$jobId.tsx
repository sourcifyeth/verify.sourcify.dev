import type { Route } from "./+types/jobs.$jobId";
import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { IoCheckmarkDoneCircle, IoCheckmarkCircle, IoOpenOutline, IoClose } from "react-icons/io5";
import { TbArrowsDiff } from "react-icons/tb";
import { useChains } from "../contexts/ChainsContext";
import { getChainName } from "../utils/chains";
import { getVerificationJobStatus, type VerificationJobStatus } from "../utils/sourcifyApi";
import PageLayout from "../components/PageLayout";
import BytecodeDiffModal from "../components/verification/BytecodeDiffModal";
import MatchBadge from "../components/verification/MatchBadge";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Verification Job - Sourcify" }, { name: "description", content: "View verification job details" }];
}

export default function JobDetails() {
  const { jobId } = useParams<{ jobId: string }>();
  const { chains } = useChains();
  const [jobData, setJobData] = useState<VerificationJobStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(15);
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [diffModalData, setDiffModalData] = useState<{
    title: string;
    onchain: string;
    recompiled: string;
  } | null>(null);
  const [compilerErrorsModalOpen, setCompilerErrorsModalOpen] = useState(false);
  const [errorMessageModalOpen, setErrorMessageModalOpen] = useState(false);
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());
  const [expandedModalErrors, setExpandedModalErrors] = useState<Set<number>>(new Set());

  const fetchJobStatus = async () => {
    if (!jobId) return;

    try {
      setLoading(true);
      const data = await getVerificationJobStatus(jobId);
      setJobData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch job status");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchJobStatus();
  }, [jobId]);

  // Auto-refresh for pending jobs with countdown
  useEffect(() => {
    if (!jobData || jobData.isJobCompleted) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchJobStatus();
          return 15; // Reset countdown
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [jobData]);

  const handleRefresh = () => {
    fetchJobStatus();
    setCountdown(15);
  };

  const getRepoUrl = (chainId: string, address: string) => {
    const repoBaseUrl = import.meta.env.VITE_SOURCIFY_REPO_URL || "https://repo.sourcify.dev";
    return `${repoBaseUrl}/${chainId}/${address}`;
  };

  const openDiffModal = (title: string, onchain: string, recompiled: string) => {
    setDiffModalData({ title, onchain, recompiled });
    setDiffModalOpen(true);
  };

  const closeDiffModal = () => {
    setDiffModalOpen(false);
    setDiffModalData(null);
  };

  const toggleErrorExpansion = (index: number, isModal: boolean = false) => {
    if (isModal) {
      setExpandedModalErrors((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(index)) {
          newSet.delete(index);
        } else {
          newSet.add(index);
        }
        return newSet;
      });
    } else {
      setExpandedErrors((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(index)) {
          newSet.delete(index);
        } else {
          newSet.add(index);
        }
        return newSet;
      });
    }
  };

  const getStatusColor = (completed: boolean, hasError: boolean) => {
    if (hasError) return "bg-red-100 text-red-800";
    if (completed) return "bg-green-100 text-green-800";
    return "bg-yellow-100 text-yellow-800";
  };

  const getStatusText = (completed: boolean, hasError: boolean) => {
    if (hasError) return "Failed";
    if (completed) return "Completed";
    return "Pending";
  };

  // Helper component for detail rows
  interface DetailRowProps {
    label: string;
    value: string | React.ReactNode;
    className?: string;
    fontMono?: boolean;
  }

  const DetailRow = ({ label, value, className, fontMono }: DetailRowProps) => {
    return (
      <div className={`${className}`}>
        <dt className="font-bold text-gray-900">{label}</dt>
        <dd className={`text-gray-900 ${fontMono ? "font-mono" : ""}`}>{value}</dd>
      </div>
    );
  };

  if (loading && !jobData) {
    return (
      <div className="pb-12 bg-cerulean-blue-50 pt-1">
        <PageLayout title="Verification Job">
          <div className="p-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-cerulean-blue-600 border-t-transparent rounded-full"></div>
            </div>
          </div>
        </PageLayout>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-12 bg-cerulean-blue-50 pt-1">
        <PageLayout title="Verification Job">
          <>
            <div className="mb-6 px-8 pt-6">
              <a href="/verify" className="text-cerulean-blue-600 hover:text-cerulean-blue-800 flex items-center">
                ← Back to Verification
              </a>
            </div>
            <div className="p-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h2 className="text-lg font-medium text-red-800 mb-2">Error Loading Job</h2>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            </div>
          </>
        </PageLayout>
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="pb-12 bg-cerulean-blue-50 pt-1">
        <PageLayout title="Verification Job">
          <div className="p-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Job not found</p>
            </div>
          </div>
        </PageLayout>
      </div>
    );
  }

  return (
    <PageLayout>
      <>
        <div className="px-8 pt-6">
          <a href="/verify" className="text-cerulean-blue-600 hover:text-cerulean-blue-800 flex items-center">
            ← Back to Verification
          </a>
        </div>

        <div className="p-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900">Verification Job</h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    jobData.isJobCompleted,
                    !!jobData.error
                  )}`}
                >
                  {getStatusText(jobData.isJobCompleted, !!jobData.error)}
                </span>
              </div>
              {!jobData.isJobCompleted && (
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-cerulean-blue-600 text-white rounded-lg hover:bg-cerulean-blue-700 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Refresh ({countdown}s)</span>
                </button>
              )}
            </div>
            <div className="space-y-4">
              <DetailRow label="Job ID" value={jobData.verificationId} fontMono />
              {jobData.contract && (
                <>
                  <DetailRow
                    label="Chain"
                    value={
                      <span>
                        {getChainName(chains, parseInt(jobData.contract.chainId))}{" "}
                        <span className="text-gray-500 text-sm">(Chain ID: {jobData.contract.chainId})</span>
                      </span>
                    }
                  />
                  <DetailRow label="Address" value={jobData.contract.address} fontMono className="break-all" />
                </>
              )}
              <DetailRow label="Job Started At" value={new Date(jobData.jobStartTime).toISOString()} />
              {jobData.jobFinishTime && (
                <DetailRow label="Job Finished At" value={new Date(jobData.jobFinishTime).toISOString()} />
              )}
              {jobData.compilationTime && <DetailRow label="Compilation Time" value={`${jobData.compilationTime}ms`} />}
            </div>
          </div>

          {/* Verification Results */}
          {jobData.isJobCompleted && jobData.contract && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 my-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Verification Result</h2>
              <div className="space-y-3">
                <div className="flex flex-row space-x-8 flex-wrap">
                  <DetailRow label="Runtime Match" value={<MatchBadge match={jobData.contract.runtimeMatch} small />} />
                  <DetailRow
                    label="Creation Match"
                    value={<MatchBadge match={jobData.contract.creationMatch} small />}
                  />
                </div>
                {(jobData.contract.runtimeMatch || jobData.contract.creationMatch) && (
                  <div className="mt-4">
                    <a
                      href={getRepoUrl(jobData.contract.chainId, jobData.contract.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-cerulean-blue-500 hover:bg-cerulean-blue-600 focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      View in Repository
                      <IoOpenOutline className="w-4 h-4" />
                    </a>
                  </div>
                )}
                {jobData.contract.verifiedAt && (
                  <DetailRow label="Verified At" value={new Date(jobData.contract.verifiedAt).toISOString()} />
                )}
                {jobData.contract.matchId && <DetailRow label="Match ID" value={jobData.contract.matchId} />}
              </div>
            </div>
          )}

          {/* Error Details */}
          {jobData.error && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Job Error Details</h2>
              <div className="space-y-4">
                <div className="space-y-3">
                  <DetailRow
                    label="Error Code"
                    value={
                      <span className="font-mono text-gray-900 bg-gray-200 px-2 py-1 rounded text-sm">
                        {jobData.error.customCode}
                      </span>
                    }
                  />
                  {/* Compiler Errors */}
                  {jobData.error.errorData?.compilerErrors && (
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-2">
                        Compiler Errors ({jobData.error.errorData.compilerErrors.length})
                      </h3>
                      <div className="space-y-3">
                        {jobData.error.errorData.compilerErrors.slice(0, 5).map((error, index) => (
                          <div key={index} className="bg-gray-100 rounded p-3">
                            <div className="flex flex-wrap gap-2 mb-2">
                              {error.type && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                  {error.type}
                                </span>
                              )}
                              {error.errorCode && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Code: {error.errorCode}
                                </span>
                              )}
                              {error.component && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700">
                                  {error.component}
                                </span>
                              )}
                              {error.sourceLocation?.file && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                  {error.sourceLocation.file}
                                </span>
                              )}
                            </div>
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                              {error.formattedMessage || error.message}
                            </pre>
                            <div className="mt-2 pt-2 border-t border-gray-300">
                              <div className="text-center">
                                <button
                                  onClick={() => toggleErrorExpansion(index)}
                                  className="text-xs text-cerulean-blue-600 hover:text-cerulean-blue-800 focus:outline-none"
                                >
                                  {expandedErrors.has(index) ? "Hide Raw Error" : "Show Raw Error"}
                                </button>
                              </div>
                              {expandedErrors.has(index) && (
                                <div className="mt-2">
                                  <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-2 overflow-auto max-h-32 text-gray-600">
                                    {JSON.stringify(error, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {jobData.error.errorData.compilerErrors.length > 5 && (
                        <div className="mt-4 text-center">
                          <button
                            onClick={() => setCompilerErrorsModalOpen(true)}
                            className="text-sm px-4 py-2 bg-cerulean-blue-600 text-white rounded-md hover:bg-cerulean-blue-700 focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
                          >
                            Show All {jobData.error.errorData.compilerErrors.length} Errors
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <dt className="font-bold text-gray-900">Error Message</dt>
                    <dd className="text-gray-900">
                      {jobData.error.message.length > 600 ? (
                        <div>
                          <div className="mb-2">
                            <span>{jobData.error.message.slice(0, 600)}...</span>
                          </div>
                          <div className="text-center">
                            <button
                              onClick={() => setErrorMessageModalOpen(true)}
                              className="text-sm px-4 py-2 bg-cerulean-blue-600 text-white rounded-md hover:bg-cerulean-blue-700 focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
                            >
                              Show Complete Message
                            </button>
                          </div>
                        </div>
                      ) : (
                        jobData.error.message
                      )}
                    </dd>
                  </div>
                  <DetailRow label="Error ID" value={jobData.error.errorId} fontMono />
                  {jobData.error.creationTransactionHash && (
                    <DetailRow
                      label="Found Creation Tx Hash"
                      value={jobData.error.creationTransactionHash}
                      fontMono
                      className="break-all"
                    />
                  )}
                </div>

                {/* Bytecode Information */}
                {jobData.error.recompiledCreationCode ||
                jobData.error.recompiledRuntimeCode ||
                jobData.error.onchainRuntimeCode ? (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Bytecode Data</h3>

                    {/* Runtime Bytecode Section */}
                    <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Runtime Bytecode</h4>
                      {jobData?.error?.onchainRuntimeCode && jobData.error?.recompiledRuntimeCode && (
                        <div className="mb-4">
                          <button
                            onClick={() =>
                              openDiffModal(
                                "Runtime",
                                jobData?.error?.onchainRuntimeCode || "",
                                jobData?.error?.recompiledRuntimeCode || ""
                              )
                            }
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-cerulean-blue-600 hover:bg-cerulean-blue-700 focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:ring-offset-2 transition-colors cursor-pointer"
                          >
                            <TbArrowsDiff className="w-4 h-4" />
                            View Diff
                          </button>
                        </div>
                      )}
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <dt className="text-sm font-medium text-gray-700">
                              Onchain
                              {jobData.error.onchainRuntimeCode && (
                                <span className="text-xs text-gray-500 ml-2">
                                  ({Math.floor(jobData.error.onchainRuntimeCode.replace("0x", "").length / 2)} bytes)
                                </span>
                              )}
                            </dt>
                          </div>
                          <dd>
                            {jobData.error.onchainRuntimeCode ? (
                              <textarea
                                readOnly
                                value={jobData.error.onchainRuntimeCode}
                                className="w-full h-32 p-2 text-xs font-mono bg-white border border-gray-300 rounded resize-none overflow-auto"
                              />
                            ) : (
                              <div className="text-gray-500 text-xs italic">No bytecode found</div>
                            )}
                          </dd>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <dt className="text-sm font-medium text-gray-700">
                              Recompiled
                              {jobData.error.recompiledRuntimeCode && (
                                <span className="text-xs text-gray-500 ml-2">
                                  ({Math.floor(jobData.error.recompiledRuntimeCode.replace("0x", "").length / 2)} bytes)
                                </span>
                              )}
                            </dt>
                          </div>
                          <dd>
                            {jobData.error.recompiledRuntimeCode ? (
                              <textarea
                                readOnly
                                value={jobData.error.recompiledRuntimeCode}
                                className="w-full h-32 p-2 text-xs font-mono bg-white border border-gray-300 rounded resize-none overflow-auto"
                              />
                            ) : (
                              <div className="text-gray-500 text-xs italic">No bytecode found</div>
                            )}
                          </dd>
                        </div>
                      </div>
                    </div>

                    {/* Creation Bytecode Section */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Creation Bytecode</h4>
                      {/* Note: Creation bytecode diff button is not shown because onchain creation bytecode is not available */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <dt className="text-sm font-medium text-gray-700">Onchain</dt>
                          </div>
                          <dd>
                            <div className="text-gray-500 text-xs italic">No bytecode found</div>
                          </dd>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <dt className="text-sm font-medium text-gray-700">
                              Recompiled
                              {jobData.error.recompiledCreationCode && (
                                <span className="text-xs text-gray-500 ml-2">
                                  ({Math.floor(jobData.error.recompiledCreationCode.replace("0x", "").length / 2)}{" "}
                                  bytes)
                                </span>
                              )}
                            </dt>
                          </div>
                          <dd>
                            {jobData.error.recompiledCreationCode ? (
                              <textarea
                                readOnly
                                value={jobData.error.recompiledCreationCode}
                                className="w-full h-32 p-2 text-xs font-mono bg-white border border-gray-300 rounded resize-none overflow-auto"
                              />
                            ) : (
                              <div className="text-gray-500 text-xs italic">No bytecode found</div>
                            )}
                          </dd>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">Bytecode Information</h3>
                    <p className="text-gray-500 text-xs ml-4">No bytecode found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Info for Pending Jobs */}
          {!jobData.isJobCompleted && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Job Status</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
                  <span className="text-yellow-800 font-medium">Job is processing...</span>
                </div>
                <p className="text-yellow-700 mt-2 text-sm">
                  The verification job is currently being processed. This page will automatically refresh every 15
                  seconds.
                </p>
                <p className="text-yellow-700 mt-1 text-sm">
                  Next refresh in: <span className="font-mono font-medium">{countdown}</span> seconds
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bytecode Diff Modal */}
        {diffModalData && (
          <BytecodeDiffModal
            isOpen={diffModalOpen}
            onClose={closeDiffModal}
            title={diffModalData.title}
            onchainBytecode={diffModalData.onchain}
            recompiledBytecode={diffModalData.recompiled}
          />
        )}

        {/* Compiler Errors Modal */}
        {jobData?.error?.errorData?.compilerErrors && (
          <div>
            <Dialog
              open={compilerErrorsModalOpen}
              onClose={() => setCompilerErrorsModalOpen(false)}
              className="relative z-50"
            >
              <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                  <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <div className="flex justify-between items-center mb-4">
                      <DialogTitle className="text-lg font-bold text-gray-900">
                        All Compiler Errors ({jobData.error.errorData.compilerErrors.length})
                      </DialogTitle>
                      <button
                        onClick={() => setCompilerErrorsModalOpen(false)}
                        className="text-gray-400 hover:text-gray-600 p-1 focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 rounded"
                      >
                        <IoClose className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto space-y-3">
                      {jobData.error.errorData.compilerErrors.map((error, index) => (
                        <div key={index} className="bg-gray-100 rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-gray-600">Error {index + 1}</div>
                            <div className="flex flex-wrap gap-2">
                              {error.type && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                  {error.type}
                                </span>
                              )}
                              {error.errorCode && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Code: {error.errorCode}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {error.component && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700">
                                Component: {error.component}
                              </span>
                            )}
                            {error.sourceLocation?.file && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                File: {error.sourceLocation.file}
                              </span>
                            )}
                            {error.sourceLocation?.start !== undefined && error.sourceLocation?.end !== undefined && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                Position: {error.sourceLocation.start}-{error.sourceLocation.end}
                              </span>
                            )}
                          </div>
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                            {error.formattedMessage || error.message}
                          </pre>
                          <div className="mt-2 pt-2 border-t border-gray-300">
                            <div className="text-center">
                              <button
                                onClick={() => toggleErrorExpansion(index, true)}
                                className="text-xs text-cerulean-blue-600 hover:text-cerulean-blue-800 focus:outline-none"
                              >
                                {expandedModalErrors.has(index) ? "Hide Raw Error" : "Show Raw Error"}
                              </button>
                            </div>
                            {expandedModalErrors.has(index) && (
                              <div className="mt-2">
                                <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-2 overflow-auto max-h-32 text-gray-600">
                                  {JSON.stringify(error, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => setCompilerErrorsModalOpen(false)}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        Close
                      </button>
                    </div>
                  </DialogPanel>
                </div>
              </div>
            </Dialog>
          </div>
        )}

        {/* Error Message Modal */}
        {jobData?.error && (
          <div>
            <Dialog
              open={errorMessageModalOpen}
              onClose={() => setErrorMessageModalOpen(false)}
              className="relative z-50"
            >
              <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                  <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <div className="flex justify-between items-center mb-4">
                      <DialogTitle className="text-lg font-bold text-gray-900">Complete Error Message</DialogTitle>
                      <button
                        onClick={() => setErrorMessageModalOpen(false)}
                        className="text-gray-400 hover:text-gray-600 p-1 focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 rounded"
                      >
                        <IoClose className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="bg-gray-50 rounded p-4">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">{jobData.error.message}</pre>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => setErrorMessageModalOpen(false)}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        Close
                      </button>
                    </div>
                  </DialogPanel>
                </div>
              </div>
            </Dialog>
          </div>
        )}
      </>
    </PageLayout>
  );
}
