import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { IoTrashOutline } from "react-icons/io5";
import { Tooltip } from "react-tooltip";
import { useChains } from "../../contexts/ChainsContext";
import { getChainName } from "../../utils/chains";
import {
  getStoredJobs,
  getPendingJobs,
  updateJobStatus,
  clearAllJobs,
  type StoredVerificationJob,
} from "../../utils/jobStorage";
import { getVerificationJobStatus } from "../../utils/sourcifyApi";
import { useServerConfig } from "../../contexts/ServerConfigContext";

interface RecentVerificationsProps {
  className?: string;
}

export default function RecentVerifications({ className = "" }: RecentVerificationsProps) {
  const navigate = useNavigate();
  const { chains } = useChains();
  const [jobs, setJobs] = useState<StoredVerificationJob[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const { serverUrl } = useServerConfig();
  const loadJobs = () => {
    const allJobs = getStoredJobs();
    setJobs(allJobs);
  };

  useEffect(() => {
    loadJobs();
  }, []);

  // Poll pending jobs every 15 seconds
  useEffect(() => {
    const pollPendingJobs = async () => {
      const pendingJobs = getPendingJobs();
      if (pendingJobs.length === 0) return;

      setIsPolling(true);
      try {
        for (const job of pendingJobs) {
          try {
            const jobData = await getVerificationJobStatus(serverUrl, job.verificationId);
            if (jobData.isJobCompleted) {
              updateJobStatus(job.verificationId, jobData);
            }
          } catch (error) {
            console.error(`Error polling job ${job.verificationId}:`, error);
          }
        }
        loadJobs(); // Refresh the display
      } finally {
        setIsPolling(false);
      }
    };

    // Initial poll
    pollPendingJobs();

    // Set up interval for polling
    const interval = setInterval(pollPendingJobs, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, []);

  const handleJobClick = (jobId: string) => {
    navigate(`/jobs/${jobId}`);
  };

  const handleClearAll = () => {
    clearAllJobs();
    loadJobs();
  };

  const getStatusColor = (job: StoredVerificationJob) => {
    if (!job.isJobCompleted) return "bg-yellow-100 text-yellow-800";
    if (job.contract?.runtimeMatch || job.contract?.creationMatch) return "bg-green-100 text-green-800";
    return "bg-red-100 text-red-800";
  };

  const getStatusText = (job: StoredVerificationJob) => {
    if (!job.isJobCompleted) return "Pending";
    if (job.contract?.runtimeMatch || job.contract?.creationMatch) return "Verified";
    return "Failed";
  };

  const truncateJobId = (jobId: string) => {
    return `${jobId.slice(0, 8)}-${jobId.slice(9, 11)}...`;
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const displayedJobs = showAll ? jobs : jobs.slice(0, 5);

  if (jobs.length === 0) {
    return (
      <div className={className}>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Recent Verifications</h3>
        <p className="text-gray-500 text-sm">Your verification jobs will appear here</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-end mb-2">
        <h3 className="text-lg font-medium text-gray-900">Recent Verifications</h3>
        <div className="flex items-center space-x-4">
          {isPolling && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="animate-spin h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full"></div>
              <span>Updating...</span>
            </div>
          )}
          {jobs.length > 0 && (
            <div
              onClick={handleClearAll}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-600 cursor-pointer"
            >
              <IoTrashOutline className="w-4 h-4" />
              <span>Clear All</span>
            </div>
          )}
        </div>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="py-2 text-left text-sm font-medium text-gray-900">Date</th>
            <th className="py-2 px-4 text-left text-sm font-medium text-gray-900">Job ID</th>
            <th className="py-2 px-4 text-left text-sm font-medium text-gray-900">Chain</th>
            <th className="py-2 px-4 text-left text-sm font-medium text-gray-900">Address</th>
            <th className="py-2 text-left text-sm font-medium text-gray-900">Status</th>
          </tr>
        </thead>
        <tbody>
          {displayedJobs.map((job) => (
            <tr key={job.verificationId} className="border-b border-gray-200 hover:bg-gray-100">
              <td className="py-2 text-sm text-gray-700">
                <div>
                  <div className="text-[0.65rem] text-gray-500">
                    {new Date(job.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (
                    {Intl.DateTimeFormat().resolvedOptions().timeZone})
                  </div>
                  <div>{new Date(job.submittedAt).toISOString().split("T")[0]}</div>
                </div>
              </td>
              <td className="py-2 px-4 text-sm">
                <button
                  onClick={() => handleJobClick(job.verificationId)}
                  className="font-mono text-cerulean-blue-600 hover:text-cerulean-blue-800 hover:bg-cerulean-blue-50 focus:outline-none text-left underline cursor-pointer"
                  title={job.verificationId}
                >
                  {truncateJobId(job.verificationId)}
                </button>
              </td>
              <td className="py-2 px-4 text-sm text-gray-600 break-words">
                {job.contract
                  ? `${getChainName(chains, parseInt(job.contract.chainId))} (${job.contract.chainId})`
                  : "-"}
              </td>
              <td className="py-2 px-4 text-sm font-mono text-gray-600">
                {job.contract?.address ? (
                  <span data-tooltip-id="address-tooltip" data-tooltip-content={job.contract.address}>
                    {truncateAddress(job.contract.address)}
                  </span>
                ) : (
                  "-"
                )}
              </td>
              <td className="py-2 text-sm">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(job)}`}>
                  {getStatusText(job)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {jobs.length > 5 && (
        <div className="mt-4 text-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAll(!showAll);
            }}
            className="text-sm text-cerulean-blue-600 hover:text-cerulean-blue-800 font-medium focus:outline-none"
          >
            {showAll ? "Show Less" : `Show All ${jobs.length} Jobs`}
          </button>
        </div>
      )}

      <Tooltip
        id="address-tooltip"
        style={{ fontSize: "14px", zIndex: 1000 }}
        className="!bg-gray-900 !text-white !rounded-lg !shadow-lg font-mono"
        delayHide={500}
        clickable={true} // To keep showing the tooltip when hovering on the tooltip
      />
    </div>
  );
}
