import type { Language } from "../../types/verification";

interface EvmVersionSelectorProps {
  selectedLanguage: Language | null;
  selectedEvmVersion: string;
  onEvmVersionSelect: (version: string) => void;
}

const SOLIDITY_EVM_VERSIONS = [
  { value: "default", label: "default (compiler defaults)" },
  { value: "homestead", label: "homestead (oldest version)" },
  { value: "tangerineWhistle", label: "tangerineWhistle" },
  { value: "spuriousDragon", label: "spuriousDragon" },
  { value: "byzantium", label: "byzantium (default for <= v0.5.4)" },
  { value: "constantinople", label: "constantinople" },
  { value: "petersburg", label: "petersburg (default for >= v0.5.5)" },
  { value: "istanbul", label: "istanbul (default for >= v0.5.14)" },
  { value: "berlin", label: "berlin (default for >= v0.8.5)" },
  { value: "london", label: "london (default for >= v0.8.7)" },
  { value: "paris", label: "paris (default for >= v0.8.18)" },
  { value: "shanghai", label: "shanghai (default for >= v0.8.20)" },
  { value: "cancun", label: "cancun (default for >= v0.8.24)" },
  { value: "prague", label: "prague (default for >= v0.8.30)" },
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
      <label className="block text-base font-semibold text-gray-900 mb-2">
        EVM Version
      </label>
      <select
        value={selectedEvmVersion}
        onChange={(e) => onEvmVersionSelect(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:border-cerulean-blue-500"
      >
        {evmVersions.map((version) => (
          <option key={version.value} value={version.value}>
            {version.label}
          </option>
        ))}
      </select>
    </div>
  );
}