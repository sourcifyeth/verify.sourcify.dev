import { IoCheckmarkDoneCircle, IoCheckmarkCircle } from "react-icons/io5";

interface MatchBadgeProps {
  match: "match" | "exact_match" | null;
  className?: string;
  small?: boolean;
}

export default function MatchBadge({ match, className = "", small = false }: MatchBadgeProps) {
  // Determine if this is an exact match
  const isExactMatch = match === "exact_match";

  const sizeClasses = small ? "px-2 py-1 text-xs md:text-sm" : "px-2 py-1 md:px-3 md:py-1 text-sm md:text-base";
  const iconSize = small ? "text-base" : "text-xl md:text-2xl";

  if (!match) {
    return (
      <span
        className={`inline-flex items-center ${sizeClasses} rounded-md font-semibold border bg-gray-100 text-gray-600 border-gray-200 w-auto flex-shrink-0 ${className}`}
      >
        <span className={`mr-1 ${iconSize}`}>-</span> No Match
      </span>
    );
  }

  const matchLabel = isExactMatch ? "Exact Match" : "Match";
  // Always use green color
  const matchColor = "bg-green-100 text-green-800 border-green-200";
  const matchIcon = isExactMatch ? <IoCheckmarkDoneCircle /> : <IoCheckmarkCircle />;

  // Tooltip content for match status
  const matchTooltipContent = isExactMatch
    ? "Exact match: The onchain and compiled bytecode match exactly, including the metadata hashes."
    : "Match: The onchain and compiled bytecode match, but metadata hashes differ or don't exist.";

  return (
    <span
      className={`inline-flex items-center ${sizeClasses} rounded-md font-semibold border ${matchColor} cursor-help w-auto flex-shrink-0 ${className}`}
      data-tooltip-id="global-tooltip"
      data-tooltip-content={matchTooltipContent}
    >
      <span className={`mr-1 ${iconSize}`}>{matchIcon}</span> {matchLabel}
    </span>
  );
}
