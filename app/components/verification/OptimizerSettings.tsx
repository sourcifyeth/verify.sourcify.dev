import type { Language } from "../../types/verification";

interface OptimizerSettingsProps {
  selectedLanguage: Language | null;
  optimizerEnabled: boolean;
  optimizerRuns: number;
  onOptimizerEnabledChange: (enabled: boolean) => void;
  onOptimizerRunsChange: (runs: number) => void;
}

export default function OptimizerSettings({
  selectedLanguage,
  optimizerEnabled,
  optimizerRuns,
  onOptimizerEnabledChange,
  onOptimizerRunsChange,
}: OptimizerSettingsProps) {
  // Only show optimizer settings for Solidity
  if (selectedLanguage !== "solidity") return null;

  return (
    <div>
      <label className="block text-base font-semibold text-gray-900 mb-2">Optimizer Settings</label>

      <div className="flex items-center space-x-6">
        <label className="flex items-center space-x-3 py-3 cursor-pointer">
          <input
            type="checkbox"
            checked={optimizerEnabled}
            onChange={(e) => onOptimizerEnabledChange(e.target.checked)}
            className="rounded border-gray-300 text-cerulean-blue-600 focus:ring-cerulean-blue-500 cursor-pointer"
          />
          <span className="text-sm text-gray-900">Optimizer Enabled</span>
        </label>

        {optimizerEnabled && (
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-900">Runs:</label>
            <input
              type="number"
              min="1"
              max="10000000"
              value={optimizerRuns}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value > 0) {
                  onOptimizerRunsChange(value);
                }
              }}
              className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:border-cerulean-blue-500"
              placeholder="200"
            />
          </div>
        )}
      </div>
    </div>
  );
}
