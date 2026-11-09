import type { VerificationJobStatus } from "./sourcifyApi";
import type { Chain } from "../types/chains";
import { getChainName } from "./chains";

export const MATCH_DOCS_URL = "https://docs.sourcify.dev/docs/exact-match-vs-match/";

export function generateDebugPrompt(jobData: VerificationJobStatus, chains: Chain[], serverUrl: string): string {
  if (!jobData.error || !jobData.contract) return "";

  const chainName = getChainName(chains, parseInt(jobData.contract.chainId));

  return `My contract verification on Sourcify failed. Find out why, and explain the cause to me in simple terms.

Verification job:
- Job URL: ${serverUrl}/v2/verify/${jobData.verificationId}
- Chain: ${chainName} (chain ID ${jobData.contract.chainId})
- Contract address: ${jobData.contract.address}
- Error code: ${jobData.error.customCode}
- Error message: ${jobData.error.message}

Do these steps:
1. Get the files and settings that were submitted to Sourcify for this job (source files, standard JSON input or metadata file). If you submitted this verification, use what you sent. If not, ask me for the files.
2. Fetch the job URL. The response contains the error details. For bytecode errors, it can also contain the recompiled and the onchain bytecode.
3. Read ${MATCH_DOCS_URL} to learn how Sourcify compares the recompiled bytecode with the onchain bytecode.
4. Find how this contract was deployed: deployment scripts, deployment or broadcast files, and build-info files.
5. Make sure that the address on this chain has the code of this contract. If the address is a proxy or a clone (for example EIP-1167), verify the implementation contract instead.
6. Compare the deployment build with the submitted files and settings: source files, compiler version, optimizer settings, EVM version, viaIR, libraries, remappings, and the contract path and name.
7. Build the contract locally with the deployment settings. Compare its bytecode with the onchain bytecode.

Then explain to me in simple terms why the verification failed. Tell me which files and settings to submit again.

Only if you find a real bug in Sourcify, tell me to open an issue, and give me the evidence for it. Do not open the issue yourself.`;
}
