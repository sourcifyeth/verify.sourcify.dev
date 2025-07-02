import React from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { Fragment } from "react";
import { IoClose } from "react-icons/io5";
import { diffChars, diffArrays } from "diff";

interface DiffSegment {
  value: string;
  added?: boolean;
  removed?: boolean;
}

interface BytecodeDiffResult {
  segments: DiffSegment[];
  hasChanges: boolean;
  addedCount: number;
  removedCount: number;
}

/**
 * Compares two bytecode strings using specified diff mode
 * @param onchain - The onchain bytecode (original)
 * @param recompiled - The recompiled bytecode (new)
 * @param diffMode - Whether to diff by "chars" or "bytes"
 * @returns Diff result with segments and statistics
 */
function compareBytecodeDiff(
  onchain: string,
  recompiled: string,
  diffMode: "chars" | "bytes" = "chars"
): BytecodeDiffResult {
  let diff;

  if (diffMode === "bytes") {
    // Convert to byte arrays - each byte is 2 hex characters
    const onchainBytes = [];
    for (let i = 0; i < onchain.length; i += 2) {
      onchainBytes.push(onchain.slice(i, i + 2));
    }

    const recompiledBytes = [];
    for (let i = 0; i < recompiled.length; i += 2) {
      recompiledBytes.push(recompiled.slice(i, i + 2));
    }

    // Diff the byte arrays
    const byteDiff = diffArrays(onchainBytes, recompiledBytes);

    // Convert back to string format
    diff = byteDiff.map((part) => ({
      ...part,
      value: part.value.join(""),
    }));
  } else {
    // Character comparison
    diff = diffChars(onchain, recompiled);
  }

  let addedCount = 0;
  let removedCount = 0;
  let hasChanges = false;

  const segments: DiffSegment[] = diff.map((part) => {
    if (part.added) {
      addedCount += part.value.length;
      hasChanges = true;
    } else if (part.removed) {
      removedCount += part.value.length;
      hasChanges = true;
    }

    return {
      value: part.value,
      added: part.added,
      removed: part.removed,
    };
  });

  return {
    segments,
    hasChanges,
    addedCount,
    removedCount,
  };
}

/**
 * Renders diff segments as JSX with proper styling
 * @param segments - The diff segments from compareBytecodeDiff
 * @returns JSX element with styled diff
 */
function renderDiffSegments(segments: DiffSegment[]): React.ReactElement {
  return (
    <>
      {segments.map((segment, index) => {
        if (segment.added) {
          return (
            <span key={index} className="bg-red-200 text-red-900" title="Added in recompiled bytecode">
              {segment.value}
            </span>
          );
        } else if (segment.removed) {
          return (
            <span
              key={index}
              className="bg-green-200 text-green-900 line-through"
              title="Removed from onchain bytecode"
            >
              {segment.value}
            </span>
          );
        } else {
          return (
            <span key={index} className="text-gray-900">
              {segment.value}
            </span>
          );
        }
      })}
    </>
  );
}

function renderSplitView(
  diffResult: BytecodeDiffResult,
  onchainRef: React.RefObject<HTMLDivElement>,
  recompiledRef: React.RefObject<HTMLDivElement>,
  handleScroll: (source: "onchain" | "recompiled") => (e: React.UIEvent<HTMLDivElement>) => void
): React.ReactElement {
  // Split the diff segments into onchain and recompiled views
  const renderOnchainView = () => {
    return diffResult.segments.map((segment, index) => {
      if (segment.removed) {
        return (
          <span key={index} className="bg-green-200 text-green-900" title="Only in onchain bytecode">
            {segment.value}
          </span>
        );
      } else if (!segment.added) {
        return (
          <span key={index} className="text-gray-900">
            {segment.value}
          </span>
        );
      }
      return null; // Don't show added segments in onchain view
    });
  };

  const renderRecompiledView = () => {
    return diffResult.segments.map((segment, index) => {
      if (segment.added) {
        return (
          <span key={index} className="bg-red-200 text-red-900" title="Only in recompiled bytecode">
            {segment.value}
          </span>
        );
      } else if (!segment.removed) {
        return (
          <span key={index} className="text-gray-900">
            {segment.value}
          </span>
        );
      }
      return null; // Don't show removed segments in recompiled view
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4 h-96">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-red-50 px-4 py-2 border-b border-gray-200">
          <h4 className="text-sm font-medium text-red-900">Recompiled Bytecode</h4>
        </div>
        <div ref={recompiledRef} className="p-4 overflow-auto h-full" onScroll={handleScroll("recompiled")}>
          <div className="font-mono text-xs break-all leading-relaxed pb-12">{renderRecompiledView()}</div>
        </div>
      </div>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-green-50 px-4 py-2 border-b border-gray-200">
          <h4 className="text-sm font-medium text-green-900">Onchain Bytecode</h4>
        </div>
        <div ref={onchainRef} className="p-4 overflow-auto h-full" onScroll={handleScroll("onchain")}>
          <div className="font-mono text-xs break-all leading-relaxed pb-12">{renderOnchainView()}</div>
        </div>
      </div>
    </div>
  );
}

interface BytecodeDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onchainBytecode: string;
  recompiledBytecode: string;
}

export default function BytecodeDiffModal({
  isOpen,
  onClose,
  title,
  onchainBytecode,
  recompiledBytecode,
}: BytecodeDiffModalProps) {
  const [viewMode, setViewMode] = React.useState<"unified" | "split">("split");
  const [diffMode, setDiffMode] = React.useState<"chars" | "bytes">("chars");
  const [diffResult, setDiffResult] = React.useState<BytecodeDiffResult | null>(null);
  const [isCalculating, setIsCalculating] = React.useState(false);

  // Move refs to component level to avoid conditional hook calls
  const onchainRef = React.useRef<HTMLDivElement>(null);
  const recompiledRef = React.useRef<HTMLDivElement>(null);
  const workerRef = React.useRef<Worker | null>(null);

  // Cleanup worker when modal closes
  React.useEffect(() => {
    if (!isOpen && workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setIsCalculating(false);
    }
  }, [isOpen]);

  // Cleanup worker on component unmount
  React.useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Calculate diff asynchronously using Web Worker when inputs change
  React.useEffect(() => {
    const calculateDiff = async () => {
      setIsCalculating(true);

      try {
        // Terminate any existing worker
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }

        // Try to use Web Worker for better performance
        if (typeof Worker !== 'undefined') {
          const result = await new Promise<BytecodeDiffResult>((resolve, reject) => {
            const worker = new Worker('/diffWorker.js');
            workerRef.current = worker;
            const id = Math.random().toString(36);
            
            worker.onmessage = (e) => {
              const { result, error, id: responseId } = e.data;
              if (responseId === id) {
                worker.terminate();
                workerRef.current = null;
                if (error) {
                  reject(new Error(error));
                } else {
                  resolve(result);
                }
              }
            };
            
            worker.onerror = (error) => {
              worker.terminate();
              workerRef.current = null;
              reject(error);
            };
            
            worker.postMessage({
              onchain: onchainBytecode,
              recompiled: recompiledBytecode,
              diffMode,
              id
            });
          });
          
          setDiffResult(result);
        } else {
          // Fallback to main thread with setTimeout
          const result = await new Promise<BytecodeDiffResult>((resolve) => {
            setTimeout(() => {
              resolve(compareBytecodeDiff(onchainBytecode, recompiledBytecode, diffMode));
            }, 0);
          });
          
          setDiffResult(result);
        }
      } catch (error) {
        console.warn('Worker failed, falling back to main thread:', error);
        // Fallback to main thread calculation
        const result = await new Promise<BytecodeDiffResult>((resolve) => {
          setTimeout(() => {
            resolve(compareBytecodeDiff(onchainBytecode, recompiledBytecode, diffMode));
          }, 0);
        });
        
        setDiffResult(result);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateDiff();

    // Cleanup function to terminate worker on unmount or dependency change
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [onchainBytecode, recompiledBytecode, diffMode]);

  const getByteCount = (bytecode: string) => {
    const clean = bytecode.startsWith("0x") ? bytecode.slice(2) : bytecode;
    return Math.floor(clean.length / 2);
  };

  const handleScroll = (source: "onchain" | "recompiled") => (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const scrollLeft = e.currentTarget.scrollLeft;

    if (source === "onchain" && recompiledRef.current) {
      recompiledRef.current.scrollTop = scrollTop;
      recompiledRef.current.scrollLeft = scrollLeft;
    } else if (source === "recompiled" && onchainRef.current) {
      onchainRef.current.scrollTop = scrollTop;
      onchainRef.current.scrollLeft = scrollLeft;
    }
  };

  const handleViewModeChange = (newMode: "unified" | "split") => {
    if (newMode === viewMode) return;
    setViewMode(newMode);
  };

  const handleDiffModeChange = (newMode: "chars" | "bytes") => {
    if (newMode === diffMode || isCalculating) return;
    setDiffMode(newMode);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-300"
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
              leave="ease-in duration-300"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all duration-300 ease-in-out">
                <div className="flex justify-between items-center mb-6">
                  <DialogTitle className="text-lg font-bold text-gray-900">{title} Bytecode Diff</DialogTitle>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 p-1 focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 rounded hover:cursor-pointer transition-colors duration-200 ease-in-out"
                  >
                    <IoClose className="w-6 h-6 transition-transform duration-200 ease-in-out hover:scale-110" />
                  </button>
                </div>

                {/* Statistics */}
                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                  <div className="space-y-1">
                    <div className="flex">
                      <span className="text-sm font-medium text-gray-600 w-40">Recompiled Bytecode:</span>
                      <span className="text-sm font-mono text-gray-900">{getByteCount(recompiledBytecode)} bytes</span>
                    </div>
                    <div className="flex">
                      <span className="text-sm font-medium text-gray-600 w-40">Onchain Bytecode:</span>
                      <span className="text-sm font-mono text-gray-900">{getByteCount(onchainBytecode)} bytes</span>
                    </div>
                    <div className="flex">
                      <span className="text-sm font-medium text-gray-600 w-40">Difference:</span>
                      <span className="text-sm font-mono text-gray-900">
                        {Math.abs(getByteCount(onchainBytecode) - getByteCount(recompiledBytecode))} bytes
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-600">Number of differences (count):</div>
                    <div className="text-sm font-mono text-gray-900 mt-1">
                      {isCalculating ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                          <span>Calculating...</span>
                        </div>
                      ) : diffResult?.hasChanges ? (
                        <span>
                          <span className="text-red-600">-{diffResult.removedCount}</span>{" "}
                          <span className="text-green-600">+{diffResult.addedCount}</span>
                        </span>
                      ) : (
                        <span className="text-green-600">No differences</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* View Mode and Diff Mode Toggles */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-200 rounded"></div>
                      <span>Only in recompiled</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-200 rounded"></div>
                      <span>Only in onchain</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700">Diff:</span>
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => handleDiffModeChange("chars")}
                          disabled={isCalculating}
                          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                            isCalculating ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                          } ${
                            diffMode === "chars"
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          }`}
                        >
                          Chars
                        </button>
                        <button
                          onClick={() => handleDiffModeChange("bytes")}
                          disabled={isCalculating}
                          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                            isCalculating ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                          } ${
                            diffMode === "bytes"
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          }`}
                        >
                          Bytes
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700">View:</span>
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => handleViewModeChange("split")}
                          className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                            viewMode === "split"
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          }`}
                        >
                          Split
                        </button>
                        <button
                          onClick={() => handleViewModeChange("unified")}
                          className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                            viewMode === "unified"
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          }`}
                        >
                          Unified
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Diff Display */}
                <div>
                  {isCalculating ? (
                    <div className="border border-gray-200 rounded-lg p-8">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="animate-spin h-8 w-8 border-4 border-cerulean-blue-600 border-t-transparent rounded-full"></div>
                        <div className="text-gray-600">Calculating diff...</div>
                        <div className="text-sm text-gray-500">This may take a moment for large bytecode</div>
                      </div>
                    </div>
                  ) : diffResult ? (
                    viewMode === "unified" ? (
                      <div className="border border-gray-200 rounded-lg">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                          <h3 className="text-sm font-medium text-gray-900">
                            {diffMode === "chars" ? "Character-by-character comparison" : "Byte-by-byte comparison"}
                          </h3>
                        </div>
                        <div className="p-4" style={{ height: "384px", overflow: "auto" }}>
                          <div className="font-mono text-xs break-all leading-relaxed">
                            {renderDiffSegments(diffResult.segments)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="bg-gray-50 px-4 py-2 border border-gray-200 rounded-t-lg">
                          <h3 className="text-sm font-medium text-gray-900">Side-by-side comparison</h3>
                        </div>
                        <div className="border-l border-r border-b border-gray-200 rounded-b-lg p-4">
                          {renderSplitView(
                            diffResult,
                            onchainRef as React.RefObject<HTMLDivElement>,
                            recompiledRef as React.RefObject<HTMLDivElement>,
                            handleScroll
                          )}
                        </div>
                      </div>
                    )
                  ) : null}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onClose}
                    className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 ease-in-out hover:cursor-pointer hover:scale-105"
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
