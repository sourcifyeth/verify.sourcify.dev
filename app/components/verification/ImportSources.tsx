import ImportFromEtherscan from "./ImportFromEtherscan";
import SubmissionResultDisplay from "./SubmissionResultDisplay";
import type { SubmissionResult } from "../../types/verification";

interface ImportSourcesProps {
  selectedChainId: string;
  contractAddress: string;
  setIsSubmitting: (isSubmitting: boolean) => void;
  setSubmissionResult: (result: SubmissionResult | null) => void;
  submissionResult: SubmissionResult | null;
  importError: string | null;
  importSuccess: string | null;
  onImportError: (error: string) => void;
  onImportSuccess: (success: string) => void;
}

export default function ImportSources({
  selectedChainId,
  contractAddress,
  setIsSubmitting,
  setSubmissionResult,
  submissionResult,
  importError,
  importSuccess,
  onImportError,
  onImportSuccess,
}: ImportSourcesProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
      <h3 className="text-lg font-semibold text-gray-900">Import Sources</h3>
      <p className="text-sm text-gray-500 mb-4">
        You can import the sources and settings from various places to submit a verification on Sourcify.
      </p>
      <div className="flex justify-start space-y-3">
        <ImportFromEtherscan
          chainId={selectedChainId}
          address={contractAddress}
          setIsSubmitting={setIsSubmitting}
          setSubmissionResult={setSubmissionResult}
          onImportError={onImportError}
          onImportSuccess={onImportSuccess}
        />
      </div>
      {importError && <div className="mt-3 text-sm text-red-600">{importError}</div>}
      {importSuccess && <div className="mt-3 text-sm text-green-600">{importSuccess}</div>}

      {/* Etherscan Submission Result */}
      {submissionResult && submissionResult.isEtherscanSubmission && (
        <div className="mt-4">
          <SubmissionResultDisplay
            submissionResult={submissionResult}
            onClose={() => setSubmissionResult(null)}
            showCloseButton={true}
          />
        </div>
      )}
    </div>
  );
}