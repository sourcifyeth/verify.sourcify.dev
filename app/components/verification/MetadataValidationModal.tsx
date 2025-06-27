import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { Fragment } from "react";
import { IoClose, IoCheckmarkCircle, IoWarning, IoCloseCircle } from "react-icons/io5";

interface SourceValidationResult {
  expectedFileName: string;
  matchedFileName?: string;
  status: "found" | "missing" | "embedded";
  expectedHash: string;
  actualHash?: string;
  isValid: boolean;
  fileSize?: number;
  content?: string;
}

interface ValidationSummary {
  allRequiredFound: boolean;
  missingCount: number;
  unnecessaryCount: number;
  sources: SourceValidationResult[];
  unnecessaryFiles: Array<{
    fileName: string;
    actualHash: string;
    fileSize: number;
  }>;
  message: string;
}

interface MetadataValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  validationResult: ValidationSummary;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MetadataValidationModal({ isOpen, onClose, validationResult }: MetadataValidationModalProps) {
  const { sources, unnecessaryFiles } = validationResult;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <DialogTitle className="text-xl font-semibold text-gray-900">Metadata Validation Details</DialogTitle>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 p-1 focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 rounded hover:cursor-pointer transition-colors"
                  >
                    <IoClose className="h-6 w-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                  {/* Summary */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Validation Summary</h3>
                    <div
                      className={`p-4 rounded-md border ${
                        validationResult.allRequiredFound
                          ? "bg-green-50 border-green-200"
                          : "bg-yellow-50 border-yellow-200"
                      }`}
                    >
                      <p
                        className={`font-medium ${
                          validationResult.allRequiredFound ? "text-green-800" : "text-yellow-800"
                        }`}
                      >
                        {validationResult.message}
                      </p>
                    </div>
                  </div>

                  {/* Expected Sources */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Expected Sources ({sources.length})</h3>
                    <div className="border border-gray-200 rounded-md overflow-hidden">
                      <div className="divide-y divide-gray-200">
                        {sources.map((source, index) => (
                          <div key={index} className="p-3 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                {source.isValid ? (
                                  <IoCheckmarkCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                ) : (
                                  <IoCloseCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                )}

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-medium text-gray-900 truncate">
                                      {source.expectedFileName}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                                        source.status === "found"
                                          ? "bg-green-100 text-green-800"
                                          : source.status === "embedded"
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {source.status}
                                    </span>
                                  </div>

                                  <div className="text-xs text-gray-500 space-y-0.5">
                                    <div>
                                      Keccak256:{" "}
                                      <code className="font-mono bg-gray-100 px-1 rounded text-xs break-all">
                                        {source.expectedHash}
                                      </code>
                                    </div>

                                    {source.matchedFileName && (
                                      <div>
                                        Matched: <span className="font-medium">{source.matchedFileName}</span>
                                        {source.fileSize && (
                                          <span className="ml-1">({formatFileSize(source.fileSize)})</span>
                                        )}
                                      </div>
                                    )}

                                    {source.status === "embedded" && (
                                      <div>Embedded ({source.content?.length.toLocaleString()} chars)</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Unnecessary Files */}
                  {unnecessaryFiles.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">
                        Unnecessary Files ({unnecessaryFiles.length})
                      </h3>
                      <div className="border border-gray-200 rounded-md overflow-hidden">
                        <div className="divide-y divide-gray-200">
                          {unnecessaryFiles.map((file, index) => (
                            <div key={index} className="p-3 hover:bg-gray-50">
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <IoWarning className="h-4 w-4 text-yellow-600 flex-shrink-0" />

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-medium text-gray-900 truncate">{file.fileName}</span>
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex-shrink-0">
                                      unnecessary
                                    </span>
                                  </div>

                                  <div className="text-xs text-gray-500 space-y-0.5">
                                    <div>
                                      Keccak256:{" "}
                                      <code className="font-mono bg-gray-100 px-1 rounded text-xs break-all">
                                        {file.actualHash}
                                      </code>
                                    </div>
                                    <div>Size: {formatFileSize(file.fileSize)}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hash Matching Explanation */}
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h4 className="font-medium text-blue-900 mb-2">How Hash Matching Works</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>• Files are matched by their keccak256 content hash, not by filename</p>
                      <p>• You can rename files as long as their content matches the expected hash</p>
                      <p>• Embedded sources are included directly in the metadata.json file</p>
                      <p>• All required hashes must be satisfied for successful verification</p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors hover:cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
