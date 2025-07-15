import type { Language, VerificationMethod } from "../types/verification";
import type { VyperVersion } from "../contexts/CompilerVersionsContext";

// Function to convert Vyper short version to long version using pre-loaded versions
export const getVyperLongVersionFromList = (shortVersion: string, vyperVersions: VyperVersion[]): string => {
  const foundVersion = vyperVersions.find((version) => version.version === shortVersion);
  return foundVersion ? foundVersion.longVersion : shortVersion;
};

export interface EtherscanResult {
  SourceCode: string;
  ABI: string;
  ContractName: string;
  CompilerVersion: string;
  OptimizationUsed: string;
  Runs: string;
  ConstructorArguments: string;
  EVMVersion: string;
  Library: string;
  LicenseType: string;
  Proxy: string;
  Implementation: string;
  SwarmSource: string;
}

export interface ProcessedEtherscanResult {
  language: Language;
  verificationMethod: VerificationMethod;
  compilerVersion: string;
  contractName: string;
  contractPath: string;
  files: File[];
  compilerSettings?: {
    evmVersion?: string;
    optimizerEnabled: boolean;
    optimizerRuns: number;
  };
}

export interface ProcessEtherscanOptions {
  vyperVersions?: VyperVersion[];
}

export const isEtherscanJsonInput = (sourceCodeObject: string): boolean => {
  return sourceCodeObject.startsWith("{{");
};

export const isEtherscanMultipleFilesObject = (sourceCodeObject: string): boolean => {
  try {
    return Object.keys(JSON.parse(sourceCodeObject)).length > 0;
  } catch (e) {
    return false;
  }
};

export const parseEtherscanJsonInput = (sourceCodeObject: string) => {
  // Etherscan wraps the json object: {{ ... }}
  return JSON.parse(sourceCodeObject.slice(1, -1));
};

export const isVyperResult = (etherscanResult: EtherscanResult): boolean => {
  return etherscanResult.CompilerVersion.startsWith("vyper");
};

export const getContractPathFromSources = (contractName: string, sources: any): string | undefined => {
  // Look for a file that contains the contract definition
  for (const [filePath, source] of Object.entries(sources)) {
    const content = typeof source === "string" ? source : (source as any).content;
    if (content && typeof content === "string") {
      // Look for contract definition in the file
      const contractRegex = new RegExp(`contract\\s+${contractName}\\s*[\\s\\S]*?\\{`, "g");
      const interfaceRegex = new RegExp(`interface\\s+${contractName}\\s*[\\s\\S]*?\\{`, "g");
      const libraryRegex = new RegExp(`library\\s+${contractName}\\s*[\\s\\S]*?\\{`, "g");

      if (contractRegex.test(content) || interfaceRegex.test(content) || libraryRegex.test(content)) {
        return filePath;
      }
    }
  }
  return undefined;
};

export const fetchFromEtherscan = async (
  chainId: string,
  address: string,
  apiKey: string
): Promise<EtherscanResult> => {
  const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;

  let response: Response;

  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(`Network error: Failed to connect to Etherscan API`);
  }

  if (!response.ok) {
    throw new Error(`Etherscan API responded with status ${response.status}`);
  }

  const resultJson = await response.json();

  if (resultJson.message === "NOTOK" && resultJson.result.includes("rate limit reached")) {
    throw new Error("Etherscan API rate limit reached, please try again later");
  }

  if (resultJson.message === "NOTOK") {
    throw new Error(`Etherscan API error: ${resultJson.result}`);
  }

  if (resultJson.result[0].SourceCode === "") {
    throw new Error("This contract is not verified on Etherscan");
  }

  return resultJson.result[0] as EtherscanResult;
};

export const processEtherscanResult = async (
  etherscanResult: EtherscanResult,
  options: ProcessEtherscanOptions = {}
): Promise<ProcessedEtherscanResult> => {
  const sourceCodeObject = etherscanResult.SourceCode;
  const contractName = etherscanResult.ContractName;

  // Determine language
  const language: Language = isVyperResult(etherscanResult) ? "vyper" : "solidity";

  // Process compiler version
  let compilerVersion = etherscanResult.CompilerVersion;

  if (compilerVersion.startsWith("vyper:")) {
    const shortVersion = compilerVersion.slice(6);
    // Convert short version to long version for Vyper using pre-loaded versions
    if (options.vyperVersions) {
      compilerVersion = getVyperLongVersionFromList(shortVersion, options.vyperVersions);
    } else {
      // Fallback to short version if no versions provided
      compilerVersion = shortVersion;
    }
  } else if (compilerVersion.charAt(0) === "v") {
    compilerVersion = compilerVersion.slice(1);
  }

  let verificationMethod: VerificationMethod;
  let files: File[] = [];
  let contractPath: string;
  let compilerSettings: ProcessedEtherscanResult["compilerSettings"];

  // Determine verification method and create files
  if (isEtherscanJsonInput(sourceCodeObject)) {
    // std-json method - compiler settings are already in the JSON input
    verificationMethod = "std-json";
    const jsonInput = parseEtherscanJsonInput(sourceCodeObject);

    // Find contract path from sources
    const foundPath = getContractPathFromSources(contractName, jsonInput.sources);
    if (!foundPath) {
      throw new Error("Could not find contract path in sources");
    }
    contractPath = foundPath;

    // Create a single JSON file
    const jsonContent = JSON.stringify(jsonInput, null, 2);
    const jsonFile = new File([jsonContent], `${contractName}-input.json`, { type: "application/json" });
    files = [jsonFile];

    // For std-json, we don't generate compiler settings since they're in the JSON input
    // compilerSettings will be undefined
  } else if (isEtherscanMultipleFilesObject(sourceCodeObject)) {
    // multiple-files method
    verificationMethod = "multiple-files";
    const sourcesObject = JSON.parse(sourceCodeObject) as { [key: string]: { content: string } };

    // Find contract path from sources
    const foundPath = getContractPathFromSources(contractName, sourcesObject);
    if (!foundPath) {
      throw new Error("Could not find contract path in sources");
    }
    contractPath = foundPath;

    // Create files from sources object
    files = Object.entries(sourcesObject).map(([filename, object]) => {
      return new File([object.content as string], filename, { type: "text/plain" });
    });

    // Generate compiler settings for multiple-files method
    compilerSettings = {
      optimizerEnabled: etherscanResult.OptimizationUsed === "1",
      optimizerRuns: parseInt(etherscanResult.Runs),
    };
    
    // Only include evmVersion if it's not "default"
    if (etherscanResult.EVMVersion.toLowerCase() !== "default") {
      compilerSettings.evmVersion = etherscanResult.EVMVersion;
    }
  } else {
    // single-file method
    verificationMethod = "single-file";
    const extension = language === "vyper" ? "vy" : "sol";
    const filename = `${contractName}.${extension}`;
    contractPath = filename;

    const sourceFile = new File([sourceCodeObject], filename, { type: "text/plain" });
    files = [sourceFile];

    // Generate compiler settings for single-file method
    compilerSettings = {
      optimizerEnabled: etherscanResult.OptimizationUsed === "1",
      optimizerRuns: parseInt(etherscanResult.Runs),
    };
    
    // Only include evmVersion if it's not "default"
    if (etherscanResult.EVMVersion.toLowerCase() !== "default") {
      compilerSettings.evmVersion = etherscanResult.EVMVersion;
    }
  }

  return {
    language,
    verificationMethod,
    compilerVersion,
    contractName,
    contractPath,
    files,
    compilerSettings,
  };
};
