import React, { useCallback, useEffect, useRef, useState } from "react";
import { AiOutlineFileAdd } from "react-icons/ai";
import { IoMdClose, IoMdWarning } from "react-icons/io";
import { BsFiletypeJson } from "react-icons/bs";
import type { VerificationMethod, Language } from "../../types/verification";

interface FileUploadProps {
  selectedMethod: VerificationMethod;
  selectedLanguage: Language | null;
  onFilesChange: (files: File[]) => void;
  uploadedFiles: File[];
}

interface FileRequirement {
  allowedExtensions: string[];
  maxFiles: number;
  description: string;
}

const getLanguageExtensions = (language: Language | null): string[] => {
  switch (language) {
    case "solidity":
      return [".sol"];
    case "vyper":
      return [".vy"];
    default:
      return [".sol", ".vy"];
  }
};

const getFileRequirements = (method: VerificationMethod, language: Language | null): FileRequirement => {
  const sourceExtensions = getLanguageExtensions(language);
  const languageName = language === "vyper" ? "Vyper" : "Solidity";

  switch (method) {
    case "std-json":
      return {
        allowedExtensions: [".json"],
        maxFiles: 1,
        description: "Single JSON file containing the Standard JSON input",
      };
    case "multiple-files":
      return {
        allowedExtensions: sourceExtensions,
        maxFiles: Infinity,
        description: `Multiple ${languageName} source files`,
      };
    case "single-file":
      return {
        allowedExtensions: sourceExtensions,
        maxFiles: 1,
        description: `Single ${languageName} source file`,
      };
    case "metadata-json":
      return {
        allowedExtensions: [".json"],
        maxFiles: 1,
        description: `Solidity Metadata JSON file`,
      };
    case "build-info":
      return {
        allowedExtensions: [".json"],
        maxFiles: 1,
        description: "Build-info JSON file from Hardhat/Foundry artifacts directory",
      };
    default:
      return {
        allowedExtensions: [".sol"],
        maxFiles: 1,
        description: "Single source file",
      };
  }
};

export default function FileUpload({
  selectedMethod,
  selectedLanguage,
  onFilesChange,
  uploadedFiles,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [overrideExtensions, setOverrideExtensions] = useState(false);
  const [showPasteMode, setShowPasteMode] = useState(false);
  const [pastedContent, setPastedContent] = useState("");
  const [pastedFileName, setPastedFileName] = useState("");
  const [fileNameError, setFileNameError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Special handling for metadata.json file upload when selectedMethod is "metadata-json"
  const requirements = getFileRequirements(selectedMethod, selectedLanguage);

  useEffect(() => {
    // reset paste mode when method changes
    setShowPasteMode(false);
  }, [selectedMethod]);

  const validateFileName = (fileName: string): string | null => {
    // For std-json, filename is optional
    if (selectedMethod === "std-json") {
      if (!fileName.trim()) {
        return null; // No error for empty filename in std-json
      }
    } else {
      if (!fileName.trim()) {
        return "File name is required";
      }
    }

    const expectedExtension = selectedMethod === "std-json" ? ".json" : selectedLanguage === "vyper" ? ".vy" : ".sol";
    if (!fileName.endsWith(expectedExtension)) {
      return `File name must end with ${expectedExtension}`;
    }

    // Check for valid filename characters
    const validFileNameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!validFileNameRegex.test(fileName)) {
      return "File name contains invalid characters";
    }

    return null;
  };

  const validateFiles = useCallback(
    (files: File[], overrideParam?: boolean) => {
      const newWarnings: string[] = [];
      const shouldOverride = overrideParam !== undefined ? overrideParam : overrideExtensions;

      // Check file extensions only if not overridden
      if (!shouldOverride) {
        const invalidFiles = files.filter((file) => {
          const extension = "." + file.name.split(".").pop()?.toLowerCase();
          return !requirements.allowedExtensions.includes(extension);
        });

        if (invalidFiles.length > 0) {
          newWarnings.push(
            `Unexpected file types: ${invalidFiles
              .map((f) => f.name)
              .join(", ")}. Expected: ${requirements.allowedExtensions.join(", ")}`
          );
        }
      }

      // Check file count for methods with limits
      if (requirements.maxFiles !== Infinity && files.length > requirements.maxFiles) {
        newWarnings.push(`Too many files. Expected maximum ${requirements.maxFiles} files.`);
      }

      setWarnings(newWarnings);
      return true; // Always return true, let warnings inform the user
    },
    [requirements, overrideExtensions]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      // Check if we have items (which can include folders) or just files
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        try {
          const newFiles = await processDroppedItems(e.dataTransfer.items);
          // Filter out .DS_Store files
          const filteredNewFiles = newFiles.filter((file) => file.name !== ".DS_Store");
          // For single file methods, replace instead of append
          const allFiles = requirements.maxFiles === 1 ? filteredNewFiles : [...uploadedFiles, ...filteredNewFiles];
          validateFiles(allFiles);
          onFilesChange(allFiles);
        } catch (error) {
          console.error("Error processing dropped items:", error);
          // Fallback to regular file handling
          const newFiles = Array.from(e.dataTransfer.files);
          // Filter out .DS_Store files
          const filteredNewFiles = newFiles.filter((file) => file.name !== ".DS_Store");
          const allFiles = requirements.maxFiles === 1 ? filteredNewFiles : [...uploadedFiles, ...filteredNewFiles];
          validateFiles(allFiles);
          onFilesChange(allFiles);
        }
      } else {
        const newFiles = Array.from(e.dataTransfer.files);
        // Filter out .DS_Store files
        const filteredNewFiles = newFiles.filter((file) => file.name !== ".DS_Store");
        const allFiles = requirements.maxFiles === 1 ? filteredNewFiles : [...uploadedFiles, ...filteredNewFiles];
        validateFiles(allFiles);
        onFilesChange(allFiles);
      }
    },
    [onFilesChange, validateFiles, uploadedFiles, requirements.maxFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFiles = Array.from(e.target.files || []);
      // Filter out .DS_Store files
      const filteredNewFiles = newFiles.filter((file) => file.name !== ".DS_Store");
      // For single file methods, replace instead of append
      const allFiles = requirements.maxFiles === 1 ? filteredNewFiles : [...uploadedFiles, ...filteredNewFiles];
      validateFiles(allFiles);
      onFilesChange(allFiles);
    },
    [onFilesChange, validateFiles, uploadedFiles, requirements.maxFiles]
  );

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    onFilesChange(newFiles);
    // Re-validate remaining files instead of clearing warnings
    validateFiles(newFiles);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "json":
        return <BsFiletypeJson className="w-5 h-5 text-blue-600" />;
      case "sol":
        return <img src="/solidity.svg" alt="Solidity" className="w-5 h-5" />;
      case "vy":
        return <img src="/vyper.svg" alt="Vyper" className="w-5 h-5" />;
      default:
        return <span className="text-lg">❓</span>;
    }
  };

  const removeAllFiles = () => {
    onFilesChange([]);
    setWarnings([]);
  };

  // Function to recursively get all files from a directory
  const getAllFilesFromEntry = async (entry: any): Promise<File[]> => {
    const files: File[] = [];

    if (entry.isFile) {
      return new Promise((resolve) => {
        entry.file((file: File) => {
          resolve([file]);
        });
      });
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      return new Promise((resolve) => {
        const readEntries = async () => {
          dirReader.readEntries(async (entries: any[]) => {
            if (entries.length === 0) {
              resolve(files);
              return;
            }

            for (const entry of entries) {
              const entryFiles = await getAllFilesFromEntry(entry);
              files.push(...entryFiles);
            }

            // Continue reading if there might be more entries
            await readEntries();
          });
        };
        readEntries();
      });
    }

    return files;
  };

  // Function to handle dropped items (files and folders)
  const processDroppedItems = async (items: DataTransferItemList): Promise<File[]> => {
    const allFiles: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          const files = await getAllFilesFromEntry(entry);
          allFiles.push(...files);
        }
      }
    }

    return allFiles;
  };

  return (
    <div className="[&_button]:cursor-default!">
      <label className="block text-base font-semibold text-gray-900 mb-2">
        {selectedMethod === "metadata-json" ? "Metadata File Upload" : "File Upload"}
      </label>

      <div className="mb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 space-y-2 md:space-y-0">
          <p className="text-sm text-gray-600">{requirements.description}</p>
          {requirements.maxFiles === 1 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Upload File</span>
              <label className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={showPasteMode}
                  onChange={(e) => {
                    setShowPasteMode(e.target.checked);
                    if (!e.target.checked) {
                      setPastedContent("");
                      setPastedFileName("");
                      setFileNameError(null);
                      // Clear any file created from pasted content
                      if (
                        uploadedFiles.length > 0 &&
                        (uploadedFiles[0].name.startsWith("pasted-content") ||
                          uploadedFiles[0].name.endsWith(".sol") ||
                          uploadedFiles[0].name.endsWith(".vy"))
                      ) {
                        onFilesChange([]);
                      }
                    }
                  }}
                  className="sr-only"
                />
                <div
                  className={`w-11 h-6 rounded-full relative transition-colors ${
                    showPasteMode ? "bg-cerulean-blue-600" : "bg-gray-200"
                  }`}
                >
                  <div
                    className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform ${
                      showPasteMode ? "translate-x-full" : ""
                    }`}
                  ></div>
                </div>
              </label>
              <span className="text-sm text-gray-700">Paste File</span>
            </div>
          )}
        </div>
        {!showPasteMode && (
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500">
              Accepted file types: {overrideExtensions ? "Any file type" : requirements.allowedExtensions.join(", ")}
              {requirements.maxFiles !== Infinity &&
                ` • Maximum ${requirements.maxFiles} file${requirements.maxFiles > 1 ? "s" : ""}`}
            </p>
            <label className="flex items-center space-x-2 text-xs text-gray-600 ">
              <input
                type="checkbox"
                checked={overrideExtensions}
                onChange={(e) => {
                  const newOverride = e.target.checked;
                  setOverrideExtensions(newOverride);
                  // Re-validate current files with new override setting
                  validateFiles(uploadedFiles, newOverride);
                }}
                className="rounded border-gray-300 text-cerulean-blue-600 focus:ring-cerulean-blue-500"
              />
              <span>Override file type restrictions</span>
            </label>
          </div>
        )}
      </div>

      {warnings.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <IoMdWarning className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
              <div className="mt-1 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {requirements.maxFiles === 1 && showPasteMode && (
        <div className="mb-4 space-y-4">
          {selectedMethod !== "std-json" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={pastedFileName}
                onChange={(e) => {
                  const fileName = e.target.value;
                  setPastedFileName(fileName);
                  const error = validateFileName(fileName);
                  setFileNameError(error);

                  // Create file if both filename and content are valid
                  if (pastedContent.trim() && fileName.trim() && !error) {
                    const blob = new Blob([pastedContent], { type: "text/plain" });
                    const file = new File([blob], fileName, { type: "text/plain" });
                    onFilesChange([file]);
                  } else {
                    onFilesChange([]);
                  }
                }}
                placeholder={selectedLanguage === "vyper" ? "MyContract.vy" : "MyContract.sol"}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:border-cerulean-blue-500 ${
                  fileNameError ? "border-red-300" : "border-gray-300"
                }`}
              />
              {fileNameError && <p className="mt-1 text-sm text-red-600">{fileNameError}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {selectedMethod === "std-json" ? "Standard JSON content" : "File content"}
            </label>
            <textarea
              value={pastedContent}
              onChange={(e) => {
                setPastedContent(e.target.value);

                if (e.target.value.trim()) {
                  if (selectedMethod === "std-json") {
                    // For std-json, always use "input.json" as filename
                    const blob = new Blob([e.target.value], { type: "text/plain" });
                    const file = new File([blob], "input.json", { type: "text/plain" });
                    onFilesChange([file]);
                  } else {
                    // For other methods, need valid filename
                    const fileNameValidationError = validateFileName(pastedFileName);
                    if (pastedFileName.trim() && !fileNameValidationError) {
                      const blob = new Blob([e.target.value], { type: "text/plain" });
                      const file = new File([blob], pastedFileName, { type: "text/plain" });
                      onFilesChange([file]);
                    } else {
                      onFilesChange([]);
                    }
                  }
                } else {
                  onFilesChange([]);
                }
              }}
              placeholder={`Paste your ${
                selectedMethod === "metadata-json"
                  ? "metadata JSON"
                  : selectedMethod === "std-json"
                  ? "Standard JSON"
                  : "file"
              } content here...`}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:border-cerulean-blue-500"
            />
          </div>
        </div>
      )}

      {!showPasteMode && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-all group min-h-[250px] flex items-center justify-center ${
            isDragOver
              ? "border-cerulean-blue-500 bg-cerulean-blue-50 shadow-lg"
              : "border-gray-300 hover:border-cerulean-blue-400 hover:bg-cerulean-blue-25"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleBrowseClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={requirements.maxFiles !== 1}
            accept={overrideExtensions ? "" : requirements.allowedExtensions.join(",")}
            onChange={handleFileSelect}
            className="hidden"
          />

          {uploadedFiles.length === 0 ? (
            <div className="text-center">
              <AiOutlineFileAdd
                className={`mx-auto h-12 w-12 transition-colors ${
                  isDragOver ? "text-cerulean-blue-500" : "text-gray-400 group-hover:text-cerulean-blue-500"
                }`}
              />
              <div className="mt-1">
                <p className="text-sm text-gray-600 group-hover:text-cerulean-blue-500">
                  Choose {requirements.maxFiles === 1 ? "a" : ""} file{requirements.maxFiles === 1 ? "" : "s"} or drag
                  and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {overrideExtensions ? "Any file type" : `${requirements.allowedExtensions.join(", ")} files`}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full">
              <div className="grid gap-2 mb-4">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-md"
                  >
                    <div className="flex items-center space-x-2">
                      {getFileIcon(file.name)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="text-red-400 hover:text-red-600 focus:outline-none p-2"
                    >
                      <IoMdClose className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-center items-center space-x-4 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBrowseClick();
                  }}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cerulean-blue-500"
                >
                  {requirements.maxFiles === 1 ? "Choose different file" : "Add more files"}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAllFiles();
                  }}
                  className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline focus:outline-none focus:underline"
                >
                  Remove all files
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
