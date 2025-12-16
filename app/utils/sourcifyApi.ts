import type { Language } from "../types/verification";
import { fetchFromEtherscan, processEtherscanResult } from "./etherscanApi";

/**
 * Custom fetch function for Sourcify API calls that adds client identification headers
 */
function sourcifyFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const gitCommit = import.meta.env.VITE_GIT_COMMIT || "dev";

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "X-Client-Source": "sourcify-ui",
      "X-Client-Version": gitCommit,
      "X-Client-Type": "web",
    },
  });
}

export interface SolidityCompilerSettings {
  evmVersion?: string;
  optimizerEnabled: boolean;
  optimizerRuns: number;
}

export interface VyperCompilerSettings {
  evmVersion?: string;
  // No optimization settings for single/multiple contracts
}

type CompilerSettings = SolidityCompilerSettings | VyperCompilerSettings;

interface StandardJsonInput {
  language: string;
  sources: {
    [fileName: string]: {
      content: string;
    };
  };
  settings: {
    optimizer: {
      enabled: boolean;
      runs: number;
    };
    evmVersion: string;
  };
}

interface VerificationPayload {
  stdJsonInput: StandardJsonInput;
  compilerVersion: string;
  contractIdentifier: string;
  creationTransactionHash?: string;
}

interface VerificationResponse {
  verificationId: string;
}

interface VerificationError {
  customCode: string;
  message: string;
  errorId: string;
}

/**
 * Builds the standard JSON input for single-file and multiple-files methods to be submitted to Sourcify in std JSON format
 */
async function buildStandardJsonInput(
  files: File[],
  language: Language,
  settings: CompilerSettings
): Promise<StandardJsonInput> {
  const sources: { [fileName: string]: { content: string } } = {};

  // Read all file contents
  for (const file of files) {
    const content = await file.text();
    sources[file.name] = { content };
  }

  const standardJsonSettings: any = {};

  // Handle language-specific compiler settings
  if (language === "solidity") {
    const soliditySettings = settings as SolidityCompilerSettings;
    standardJsonSettings.optimizer = {
      enabled: soliditySettings.optimizerEnabled,
      runs: soliditySettings.optimizerRuns,
    };
  }
  // For Vyper, no optimization settings are added

  // Only include evmVersion if it's not "default"
  if (settings.evmVersion?.toLowerCase() !== "default") {
    standardJsonSettings.evmVersion = settings.evmVersion;
  }

  return {
    language: language === "vyper" ? "Vyper" : "Solidity",
    sources,
    settings: standardJsonSettings,
  };
}

async function submitStandardJsonVerification(
  serverUrl: string,
  chainId: string,
  address: string,
  stdJsonInput: StandardJsonInput,
  compilerVersion: string,
  contractIdentifier: string,
  creationTransactionHash?: string
): Promise<VerificationResponse> {
  const payload: VerificationPayload = {
    stdJsonInput,
    compilerVersion,
    contractIdentifier,
    ...(creationTransactionHash && { creationTransactionHash }),
  };

  const response = await sourcifyFetch(
    `${serverUrl}/v2/verify/${chainId}/${address}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error: VerificationError = await response.json();
    throw new Error(`${error.customCode}: ${error.message}`);
  }

  return response.json();
}

export async function assembleAndSubmitStandardJson(
  serverUrl: string,
  chainId: string,
  address: string,
  files: File[],
  language: Language,
  compilerVersion: string,
  contractIdentifier: string,
  settings: CompilerSettings,
  creationTransactionHash?: string
): Promise<VerificationResponse> {
  const stdJsonInput = await buildStandardJsonInput(files, language, settings);

  return submitStandardJsonVerification(
    serverUrl,
    chainId,
    address,
    stdJsonInput,
    compilerVersion,
    contractIdentifier,
    creationTransactionHash
  );
}

export async function submitStdJsonFile(
  serverUrl: string,
  chainId: string,
  address: string,
  stdJsonFile: File,
  compilerVersion: string,
  contractIdentifier: string,
  creationTransactionHash?: string
): Promise<VerificationResponse> {
  const stdJsonContent = await stdJsonFile.text();
  let stdJsonInput: StandardJsonInput;

  try {
    stdJsonInput = JSON.parse(stdJsonContent);
  } catch (error) {
    throw new Error("Invalid JSON format in uploaded file");
  }

  return submitStandardJsonVerification(
    serverUrl,
    chainId,
    address,
    stdJsonInput,
    compilerVersion,
    contractIdentifier,
    creationTransactionHash
  );
}

interface MetadataVerificationPayload {
  sources: Record<string, string>;
  metadata: any;
  creationTransactionHash?: string;
}

export async function submitMetadataVerification(
  serverUrl: string,
  chainId: string,
  address: string,
  sources: Record<string, string>,
  metadata: any,
  creationTransactionHash?: string
): Promise<VerificationResponse> {
  const payload: MetadataVerificationPayload = {
    sources,
    metadata,
    ...(creationTransactionHash && { creationTransactionHash }),
  };

  const response = await sourcifyFetch(
    `${serverUrl}/v2/verify/metadata/${chainId}/${address}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error: VerificationError = await response.json();
    throw new Error(`${error.customCode}: ${error.message}`);
  }

  return response.json();
}

export interface ExternalVerification {
  statusUrl?: string;
  contractApiUrl?: string;
  explorerUrl?: string;
  verificationId?: string;
  error?: string;
}

export interface ExternalVerifications {
  etherscan?: ExternalVerification;
  blockscout?: ExternalVerification;
  routescan?: ExternalVerification;
}

// Verification Job Status Types
export interface VerificationJobStatus {
  isJobCompleted: boolean;
  verificationId: string;
  error?: {
    customCode: string;
    message: string;
    errorId: string;
    recompiledCreationCode?: string;
    recompiledRuntimeCode?: string;
    onchainRuntimeCode?: string;
    creationTransactionHash?: string;
    errorData?: {
      compilerErrors?: Array<{
        component: string;
        errorCode: string;
        formattedMessage: string;
        message: string;
        severity: string;
        sourceLocation?: {
          end: number;
          file: string;
          start: number;
        };
        type: string;
      }>;
    };
  };
  jobStartTime: string;
  jobFinishTime?: string;
  compilationTime?: string;
  contract?: {
    match: "match" | "exact_match" | null;
    creationMatch: "match" | "exact_match" | null;
    runtimeMatch: "match" | "exact_match" | null;
    chainId: string;
    address: string;
    verifiedAt?: string;
    matchId?: string;
  };
  externalVerifications?: ExternalVerifications;
}

export async function getVerificationJobStatus(
  serverUrl: string,
  verificationId: string
): Promise<VerificationJobStatus> {
  const response = await sourcifyFetch(
    `${serverUrl}/v2/verify/${verificationId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      const error: VerificationError = await response.json();
      throw new Error(`Job not found: ${error.message}`);
    }
    const error: VerificationError = await response.json();
    throw new Error(`${error.customCode}: ${error.message}`);
  }

  return response.json();
}

export async function submitEtherscanVerification(
  serverUrl: string,
  chainId: string,
  address: string,
  apiKey: string
): Promise<VerificationResponse> {
  // Fetch data from Etherscan and process the result
  const etherscanResult = await fetchFromEtherscan(chainId, address, apiKey);
  const processedResult = await processEtherscanResult(etherscanResult);

  return await submitStandardJsonVerification(
    serverUrl,
    chainId,
    address,
    processedResult.jsonInput as StandardJsonInput,
    processedResult.compilerVersion,
    `${processedResult.contractPath}:${processedResult.contractName}`
  );
}
