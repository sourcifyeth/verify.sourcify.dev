import type { Language } from "../types/verification";

const SOURCIFY_SERVER_URL = import.meta.env.VITE_SOURCIFY_SERVER_URL || "https://sourcify.dev/server";

interface CompilerSettings {
  evmVersion: string;
  optimizerEnabled: boolean;
  optimizerRuns: number;
}

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

  return {
    language: language === "vyper" ? "Vyper" : "Solidity",
    sources,
    settings: {
      optimizer: {
        enabled: settings.optimizerEnabled,
        runs: settings.optimizerRuns,
      },
      evmVersion: settings.evmVersion === "default" ? "default" : settings.evmVersion,
    },
  };
}

async function submitStandardJsonVerification(
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

  const response = await fetch(`${SOURCIFY_SERVER_URL}/v2/verify/${chainId}/${address}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error: VerificationError = await response.json();
    throw new Error(`${error.customCode}: ${error.message}`);
  }

  return response.json();
}

export async function assembleAndSubmitStandardJson(
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
    chainId,
    address,
    stdJsonInput,
    compilerVersion,
    contractIdentifier,
    creationTransactionHash
  );
}

export async function submitStdJsonFile(
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
    chainId,
    address,
    stdJsonInput,
    compilerVersion,
    contractIdentifier,
    creationTransactionHash
  );
}