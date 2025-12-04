import { useState } from "react";
import type { ValidationSummary } from "../../utils/metadataValidation";
import MetadataValidationModal from "./MetadataValidationModal";

interface MetadataValidationProps {
  metadataFile: File | null;
  validationResult: ValidationSummary | null;
  validationError: string | null;
  isValidating: boolean;
}

export default function MetadataValidation({
  metadataFile,
  validationResult,
  validationError,
  isValidating,
}: MetadataValidationProps) {
  const [showModal, setShowModal] = useState(false);

  if (!metadataFile) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-900">Source File Validation</h4>
      
      {isValidating && (
        <div className="flex items-center space-x-2 text-blue-600">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="text-sm">Validating sources...</span>
        </div>
      )}
      
      {validationError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{validationError}</p>
        </div>
      )}
      
      {validationResult && (
        <div className={`p-4 rounded-md border ${
          validationResult.allRequiredFound 
            ? "bg-green-50 border-green-200" 
            : "bg-yellow-50 border-yellow-200"
        }`}>
          <div className={`text-sm ${
            validationResult.allRequiredFound 
              ? "text-green-800" 
              : "text-yellow-800"
          }`}>
            <p className="font-medium">{validationResult.message}</p>
            
            <div className="flex items-center justify-between mt-3">
              <div className="text-xs space-y-1">
                {!validationResult.allRequiredFound && (
                  <>
                    {validationResult.sources
                      .filter(s => s.status === "missing")
                      .slice(0, 2)
                      .map(source => (
                        <div key={source.expectedFileName} className="flex items-center space-x-2">
                          <span className="text-red-600">✗</span>
                          <span>Missing: {source.expectedFileName}</span>
                        </div>
                      ))}
                    
                    {validationResult.sources
                      .filter(s => !s.isValid && s.status !== "missing")
                      .slice(0, 2)
                      .map(source => (
                        <div key={source.expectedFileName} className="flex items-center space-x-2">
                          <span className="text-red-600">✗</span>
                          <span>Invalid hash: {source.expectedFileName}</span>
                        </div>
                      ))}
                    
                    {validationResult.unnecessaryFiles.slice(0, 2).map(file => (
                      <div key={file.fileName} className="flex items-center space-x-2">
                        <span className="text-yellow-600">⚠</span>
                        <span>Unnecessary: {file.fileName}</span>
                      </div>
                    ))}
                    
                    {(validationResult.sources.length + validationResult.unnecessaryFiles.length) > 6 && (
                      <div className="text-gray-500">... and more</div>
                    )}
                  </>
                )}
              </div>
              
              <button
                onClick={() => setShowModal(true)}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Show Details
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Validation Details Modal */}
      {validationResult && (
        <MetadataValidationModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          validationResult={validationResult}
        />
      )}
    </div>
  );
}
