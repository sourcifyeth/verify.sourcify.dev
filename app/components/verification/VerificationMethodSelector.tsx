import { Tooltip as ReactTooltip } from "react-tooltip";
import { verificationMethods } from "../../data/verificationMethods";
import type { Language } from "../../types/verification";

interface VerificationMethodSelectorProps {
  selectedLanguage: Language | "";
  selectedMethod: string;
  onMethodSelect: (method: string) => void;
}

export default function VerificationMethodSelector({
  selectedLanguage,
  selectedMethod,
  onMethodSelect,
}: VerificationMethodSelectorProps) {
  if (!selectedLanguage) return null;

  const methods = verificationMethods[selectedLanguage as keyof typeof verificationMethods];

  return (
    <div>
      <label className="block text-base font-semibold text-gray-900 mb-2">Verification Method</label>
      <div className="flex flex-wrap gap-4">
        {methods?.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => onMethodSelect(method.id)}
            className={`relative flex flex-col items-center p-3 border-2 rounded-lg text-center transition-all duration-200 cursor-pointer w-36 ${
              selectedMethod === method.id
                ? "border-cerulean-blue-500 bg-cerulean-blue-50"
                : "border-gray-300 hover:border-cerulean-blue-300 hover:bg-gray-50"
            }`}
          >
            {method.id === "std-json" && (
              <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full shadow-sm">
                Preferred
              </span>
            )}
            {method.id === "metadata-json" && (
              <>
                <button
                  type="button"
                  data-tooltip-id="metadata-json-tooltip"
                  data-tooltip-content="Click to learn more"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open("https://docs.soliditylang.org/en/latest/metadata.html", "_blank");
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 rounded-full flex items-center justify-center text-xs font-medium transition-colors duration-200 shadow-sm cursor-pointer"
                >
                  ?
                </button>
                <ReactTooltip id="metadata-json-tooltip" place="top" />
              </>
            )}
            <h3
              className={`text-base font-medium mb-1 ${
                selectedMethod === method.id ? "text-cerulean-blue-600" : "text-gray-700"
              }`}
            >
              {method.title}
            </h3>
            <p className="text-xs text-gray-600">{method.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
