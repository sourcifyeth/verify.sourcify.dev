import { useState } from "react";
import { IoCheckmark, IoCopyOutline } from "react-icons/io5";
import { MATCH_DOCS_URL } from "../../utils/debugPrompt";

interface DebugPromptProps {
  prompt: string;
  bugReportUrl?: string;
}

export default function DebugPrompt({ prompt, bugReportUrl }: DebugPromptProps) {
  const [copied, setCopied] = useState(false);

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-6 pt-4 border-t border-gray-200">
      <h3 className="text-base font-bold text-gray-900 mb-2">Find the cause</h3>
      <p className="text-gray-600 text-sm mb-3">
        Most failed verifications use files or settings that are different from the deployment (see{" "}
        <a href={MATCH_DOCS_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-900">
          Exact Match vs Match
        </a>
        ). Copy this prompt into the AI agent that submitted the verification, or into an agent that runs where the
        source code is.
      </p>
      <button
        type="button"
        onClick={copyPrompt}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-cerulean-blue-500 hover:bg-cerulean-blue-600 focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:ring-offset-2 transition-colors"
      >
        {copied ? <IoCheckmark className="w-4 h-4" /> : <IoCopyOutline className="w-4 h-4" />}
        {copied ? "Prompt copied" : "Debug with your agent"}
      </button>
      <textarea
        readOnly
        value={prompt}
        className="mt-3 w-full h-40 p-2 text-xs font-mono bg-gray-50 border border-gray-300 rounded resize-y overflow-auto"
      />
      {bugReportUrl && (
        <p className="text-gray-500 text-xs mt-3">
          Still can't figure it out, or is it a real bug?{" "}
          <a href={bugReportUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">
            Open an issue
          </a>
        </p>
      )}
    </div>
  );
}
