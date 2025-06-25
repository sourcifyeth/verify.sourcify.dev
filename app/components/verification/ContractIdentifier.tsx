import type { Language } from "../../types/verification";

interface ContractIdentifierProps {
  selectedLanguage: Language | null;
  selectedMethod: string;
  contractIdentifier: string;
  onContractIdentifierChange: (identifier: string) => void;
  uploadedFiles: File[];
}

export default function ContractIdentifier({
  selectedLanguage,
  selectedMethod,
  contractIdentifier,
  onContractIdentifierChange,
  uploadedFiles,
}: ContractIdentifierProps) {
  if (!selectedLanguage || !selectedMethod || selectedMethod === "metadata-json") return null;

  const getPlaceholderText = () => {
    if (selectedLanguage === "vyper") {
      return "contracts/MyContract.vy:MyContract";
    }
    return "contracts/Storage.sol:Storage";
  };

  const getHelpText = () => {
    if (selectedLanguage === "vyper") {
      return "The fully qualified file path and contract name (e.g., contracts/MyContract.vy:MyContract)";
    }
    return "The fully qualified file path and contract name (e.g., contracts/Storage.sol:Storage)";
  };

  return (
    <div>
      <label className="block text-base font-semibold text-gray-900 mb-2">
        Contract Identifier
      </label>
      <div className="mb-3">
        <p className="text-sm text-gray-600">
          {getHelpText()}
        </p>
        {uploadedFiles.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-500">Available files:</p>
            <ul className="text-xs text-gray-500 ml-2">
              {uploadedFiles
                .filter(file => {
                  const ext = file.name.split('.').pop()?.toLowerCase();
                  return selectedLanguage === "vyper" ? ext === "vy" : ext === "sol";
                })
                .map((file, index) => (
                  <li key={index}>• {file.name}</li>
                ))}
            </ul>
          </div>
        )}
      </div>
      <input
        type="text"
        value={contractIdentifier}
        onChange={(e) => onContractIdentifierChange(e.target.value)}
        placeholder={getPlaceholderText()}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:border-cerulean-blue-500"
      />
    </div>
  );
}