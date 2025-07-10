import type { Language } from "../../types/verification";

interface LanguageSelectorProps {
  selectedLanguage: Language | null;
  onLanguageSelect: (language: Language) => void;
}

export default function LanguageSelector({ selectedLanguage, onLanguageSelect }: LanguageSelectorProps) {
  return (
    <div>
      <label className="block text-base font-semibold text-gray-900 mb-2">Language</label>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => onLanguageSelect("solidity")}
          className={`w-32 p-4 border-2 rounded-lg text-center transition-all duration-200 ${
            selectedLanguage === "solidity"
              ? "border-cerulean-blue-500 bg-cerulean-blue-50"
              : "border-gray-300 hover:border-cerulean-blue-300 hover:bg-gray-50"
          }`}
        >
          <img src="/solidity.svg" alt="Solidity" className="mx-auto w-8 h-8 mb-2" />
          <h3
            className={`text-sm font-medium ${
              selectedLanguage === "solidity" ? "text-cerulean-blue-600" : "text-gray-700"
            }`}
          >
            Solidity
          </h3>
        </button>

        <button
          type="button"
          onClick={() => onLanguageSelect("vyper")}
          className={`w-32 p-4 border-2 rounded-lg text-center transition-all duration-200 ${
            selectedLanguage === "vyper"
              ? "border-cerulean-blue-500 bg-cerulean-blue-50"
              : "border-gray-300 hover:border-cerulean-blue-300 hover:bg-gray-50"
          }`}
        >
          <img src="/vyper.svg" alt="Vyper" className="mx-auto w-8 h-8 mb-2" />
          <h3
            className={`text-sm font-medium ${
              selectedLanguage === "vyper" ? "text-cerulean-blue-600" : "text-gray-700"
            }`}
          >
            Vyper
          </h3>
        </button>
      </div>
    </div>
  );
}
