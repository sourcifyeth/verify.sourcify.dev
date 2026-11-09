import type { VerificationJobStatus } from "./sourcifyApi";
import type { Chain } from "../types/chains";
import { getChainName } from "./chains";

export const DISCORD_URL = "https://discord.com/invite/6aqd9cfZ9s";
export const MATRIX_URL = "https://matrix.to/#/#ethereum_source-verify:gitter.im";

// These codes come from the user's input, not from a Sourcify bug
const NOT_A_BUG_CODES = ["already_verified", "contract_not_deployed"];

export function canReportBug(jobData: VerificationJobStatus): boolean {
  return !!jobData.error && !!jobData.contract && !NOT_A_BUG_CODES.includes(jobData.error.customCode);
}

// Opens the bug report form; its required fields block empty reports
export function generateGitHubIssueUrl(jobData: VerificationJobStatus, chains: Chain[], serverUrl: string): string {
  if (!jobData.error || !jobData.contract) return "";

  const chainName = getChainName(chains, parseInt(jobData.contract.chainId));
  const shortAddress = `${jobData.contract.address.slice(0, 6)}...${jobData.contract.address.slice(-4)}`;

  const title = `Verification Failed: ${jobData.error.customCode || "Unknown Error"} - ${chainName} (${
    jobData.contract.chainId
  }) ${shortAddress}`;

  const compilerErrors = jobData.error.errorData?.compilerErrors ?? [];

  const reproduce = `- **Job ID:** \`${jobData.verificationId}\`
- **Chain:** ${chainName} (${jobData.contract.chainId})
- **Contract Address:** \`${jobData.contract.address}\`
- **Error Code:** \`${jobData.error.customCode || "N/A"}\`
- **Server URL:** \`${serverUrl}\`
- **Job Started:** ${new Date(jobData.jobStartTime).toISOString()}
${jobData.jobFinishTime ? `- **Job Finished:** ${new Date(jobData.jobFinishTime).toISOString()}\n` : ""}
**Error Details:**
\`\`\`
${jobData.error.message}
\`\`\`
${
  compilerErrors.length
    ? `
**Compiler Errors (${compilerErrors.length}):**
\`\`\`
${compilerErrors
  .slice(0, 3)
  .map((err) => err.formattedMessage || err.message)
  .join("\n\n")}
\`\`\`
${compilerErrors.length > 3 ? `\n... and ${compilerErrors.length - 3} more errors\n` : ""}`
    : ""
}
*Prefilled by the Sourcify verification UI.*`;

  const issueUrl = new URL("https://github.com/argotorg/sourcify/issues/new");
  issueUrl.searchParams.set("template", "bug_report.yml");
  issueUrl.searchParams.set("title", title);
  issueUrl.searchParams.set("reproduce", reproduce);

  return issueUrl.toString();
}
