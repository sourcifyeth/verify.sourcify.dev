import { frameworkMethods } from "../../data/verificationMethods";

interface FrameworkSelectorProps {
  selectedMethod: string;
  onMethodSelect: (method: string) => void;
}

export default function FrameworkSelector({ selectedMethod, onMethodSelect }: FrameworkSelectorProps) {
  return (
    <div className="flex gap-4 mt-4">
      {frameworkMethods.map((method) => (
        <button
          key={method.id}
          type="button"
          onClick={() => onMethodSelect(method.id)}
          className={`relative flex items-center justify-center gap-2 p-3 border-2 rounded-lg text-center transition-all duration-200 cursor-pointer w-36 ${
            selectedMethod === method.id
              ? "border-cerulean-blue-500 bg-cerulean-blue-50"
              : "border-gray-300 hover:border-cerulean-blue-300 hover:bg-gray-50"
          }`}
        >
          <img src={method.icon} alt={method.title} className="w-6 h-6" />
          <h3
            className={`text-base font-medium ${
              selectedMethod === method.id ? "text-cerulean-blue-600" : "text-gray-700"
            }`}
          >
            {method.title}
          </h3>
        </button>
      ))}
    </div>
  );
}
