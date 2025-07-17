import type { SubmissionResult } from "../../types/verification";

interface SubmissionResultDisplayProps {
  submissionResult: SubmissionResult;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export default function SubmissionResultDisplay({
  submissionResult,
  onClose,
  showCloseButton = false,
}: SubmissionResultDisplayProps) {
  return (
    <div
      className={`p-4 rounded-md ${showCloseButton ? "relative " : ""}${
        submissionResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
      }`}
    >
      {/* Close button */}
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {submissionResult.success ? (
        <div className={`flex flex-col items-center text-green-800 ${showCloseButton ? "pr-8" : ""}`}>
          <h3 className="font-medium text-lg">
            {submissionResult.isEtherscanSubmission 
              ? "Etherscan import submitted successfully!" 
              : "Verification submitted successfully!"}
          </h3>
          <div className="text-sm mt-2">Verification Job ID:</div>
          <span className="text-sm mt-1 font-mono bg-gray-100 text-gray-900 px-2 py-1 rounded-md">
            {submissionResult.verificationId}
          </span>

          <div className="mt-6">
            <a
              href={`/jobs/${submissionResult.verificationId}`}
              className="inline-flex items-center px-6 py-2 rounded-md text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors shadow-sm"
            >
              View Job Status
            </a>
          </div>

          {!submissionResult.isEtherscanSubmission && (
            <p className="text-sm mt-3 text-gray-600 text-center">
              Your verification is being processed. Click above to monitor progress.
            </p>
          )}
        </div>
      ) : (
        <div className={`text-red-800 ${showCloseButton ? "pr-8" : ""}`}>
          <h3 className="font-medium text-lg">
            {submissionResult.isEtherscanSubmission 
              ? "Etherscan import failed" 
              : "Verification failed"}
          </h3>
          <p className="mt-2 text-sm">{submissionResult.error}</p>
        </div>
      )}
    </div>
  );
}
