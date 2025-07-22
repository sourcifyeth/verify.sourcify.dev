import type { Language } from "../../types/verification";

interface EvmVersionSelectorProps {
  selectedLanguage: Language | null;
  selectedEvmVersion: string;
  onEvmVersionSelect: (version: string) => void;
}

const SOLIDITY_EVM_VERSIONS = [
  { value: "default" },
  { value: "homestead" },
  { value: "tangerineWhistle" },
  { value: "spuriousDragon" },
  { value: "byzantium" },
  { value: "constantinople" },
  { value: "petersburg" },
  { value: "istanbul" },
  { value: "berlin" },
  { value: "london" },
  { value: "paris" },
  { value: "shanghai" },
  { value: "cancun" },
  { value: "prague" },
];

const VYPER_EVM_VERSIONS = [
  { value: "constantinople", label: "constantinople" },
  { value: "petersburg", label: "petersburg" },
  { value: "istanbul", label: "istanbul" },
  { value: "berlin", label: "berlin" },
  { value: "london", label: "london" },
  { value: "paris", label: "paris" },
  { value: "shanghai", label: "shanghai" },
  { value: "cancun", label: "cancun" },
  { value: "prague", label: "prague" },
];

export default function EvmVersionSelector({
  selectedLanguage,
  selectedEvmVersion,
  onEvmVersionSelect,
}: EvmVersionSelectorProps) {
  if (!selectedLanguage) return null;

  const evmVersions = selectedLanguage === "vyper" ? VYPER_EVM_VERSIONS : SOLIDITY_EVM_VERSIONS;

  return (
    <div>
      <label className="block text-base font-semibold text-gray-900 mb-2">EVM Version</label>
      <select
        value={selectedEvmVersion}
        onChange={(e) => onEvmVersionSelect(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:border-cerulean-blue-500"
      >
        <option value="">Select EVM version</option>
        {evmVersions.map((version) => (
          <option key={version.value} value={version.value}>
            {version.value}
          </option>
        ))}
      </select>
    </div>
  );
}
