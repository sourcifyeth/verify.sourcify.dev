import type { VerificationJobStatus } from "./sourcifyApi";
import type { Chain } from "../types/chains";
import { getChainName } from "./chains";

export function generateGitHubIssueUrl(
  jobData: VerificationJobStatus,
  chains: Chain[],
  serverUrl: string
): string {
  if (!jobData.error || !jobData.contract) return '';
  
  const chainName = getChainName(chains, parseInt(jobData.contract.chainId));
  const shortAddress = `${jobData.contract.address.slice(0, 6)}...${jobData.contract.address.slice(-4)}`;
  
  const title = `Verification Failed: ${jobData.error.customCode || 'Unknown Error'} - ${chainName} (${jobData.contract.chainId}) ${shortAddress}`;
  
  const body = `<!--- Please fill the section in the end of this issue and explain why you expect this job to not fail. If possible, please provide the JSON input you used. --->

## Verification Job Failed

**Job ID:** \`${jobData.verificationId}\`
**Chain:** ${getChainName(chains, parseInt(jobData.contract.chainId))} (${jobData.contract.chainId})
**Contract Address:** \`${jobData.contract.address}\`
**Error Code:** \`${jobData.error.customCode || 'N/A'}\`
**Server URL:** \`${serverUrl}\`

### Error Details
\`\`\`
${jobData.error.message}
\`\`\`

${jobData.error.errorData?.compilerErrors?.length ? `
### Compiler Errors (${jobData.error.errorData.compilerErrors.length})
\`\`\`
${jobData.error.errorData.compilerErrors.slice(0, 3).map(err => err.formattedMessage || err.message).join('\n\n')}
\`\`\`
${jobData.error.errorData.compilerErrors.length > 3 ? `\n... and ${jobData.error.errorData.compilerErrors.length - 3} more errors` : ''}
` : ''}

### Additional Information
- **Job Started:** ${new Date(jobData.jobStartTime).toISOString()}
${jobData.jobFinishTime ? `- **Job Finished:** ${new Date(jobData.jobFinishTime).toISOString()}` : ''}
${jobData.compilationTime ? `- **Compilation Time:** ${jobData.compilationTime}ms` : ''}

### User Input and Expectation
**Why do you expect this verification to succeed?**
<!-- Please explain why you believe this verification should work -->

**Files Used:**
<!-- Please upload the files you submitted for verification (source code, metadata, etc.) by dragging and dropping them here or sharing them via a link -->
\`\`\`
<!-- Upload files directly to this issue -->
\`\`\`

**Additional Context:**
<!-- Any other relevant information -->

---
*This issue was automatically generated from the Sourcify verification UI.*`;

  const issueUrl = new URL('https://github.com/ethereum/sourcify/issues/new');
  issueUrl.searchParams.set('title', title);
  issueUrl.searchParams.set('body', body);
  issueUrl.searchParams.set('labels', 'bug,verification-failure');
  
  return issueUrl.toString();
}