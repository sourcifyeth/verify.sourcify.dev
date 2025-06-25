import type { Language, VerificationMethod } from "../../types/verification";
import EvmVersionSelector from "./EvmVersionSelector";
import OptimizerSettings from "./OptimizerSettings";

interface CompilerSettingsProps {
  selectedLanguage: Language | null;
  selectedMethod: string;
  isFrameworkMethod: boolean;
  evmVersion: string;
  optimizerEnabled: boolean;
  optimizerRuns: number;
  onEvmVersionChange: (version: string) => void;
  onOptimizerEnabledChange: (enabled: boolean) => void;
  onOptimizerRunsChange: (runs: number) => void;
}

export default function CompilerSettings({
  selectedLanguage,
  selectedMethod,
  isFrameworkMethod,
  evmVersion,
  optimizerEnabled,
  optimizerRuns,
  onEvmVersionChange,
  onOptimizerEnabledChange,
  onOptimizerRunsChange,
}: CompilerSettingsProps) {
  // Only show for single-file and multiple-files methods
  const shouldShow = !isFrameworkMethod && (selectedMethod === "single-file" || selectedMethod === "multiple-files");

  if (!shouldShow) return null;

  return (
    <div className="border border-gray-300 rounded-lg p-4 ">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Compiler Settings</h3>

      <div className="space-y-4">
        <EvmVersionSelector
          selectedLanguage={selectedLanguage}
          selectedEvmVersion={evmVersion}
          onEvmVersionSelect={onEvmVersionChange}
        />

        {selectedLanguage === "solidity" && (
          <OptimizerSettings
            selectedLanguage={selectedLanguage}
            optimizerEnabled={optimizerEnabled}
            optimizerRuns={optimizerRuns}
            onOptimizerEnabledChange={onOptimizerEnabledChange}
            onOptimizerRunsChange={onOptimizerRunsChange}
          />
        )}
      </div>
    </div>
  );
}
