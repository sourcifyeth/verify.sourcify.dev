import type { VyperVersion } from "../contexts/CompilerVersionsContext";
import {
  EtherscanUtils,
  EtherscanImportError,
  type EtherscanResult,
  type ProcessedEtherscanResult,
} from "@ethereum-sourcify/lib-sourcify";

// Function to convert Vyper short version to long version using pre-loaded versions
export const getVyperLongVersionFromList = (
  shortVersion: string,
  vyperVersions: VyperVersion[]
): string => {
  const foundVersion = vyperVersions.find(
    (version) => version.version === shortVersion
  );
  return foundVersion ? foundVersion.longVersion : shortVersion;
};

export const fetchFromEtherscan = async (
  chainId: string,
  address: string,
  apiKey: string = ""
): Promise<EtherscanResult> => {
  try {
    return await EtherscanUtils.fetchFromEtherscan(chainId, address, apiKey);
  } catch (error) {
    if (error instanceof EtherscanImportError) {
      // Convert EtherscanImportError to regular Error for compatibility
      switch (error.code) {
        case "etherscan_network_error":
          throw new Error("Network error: Failed to connect to Etherscan API");
        case "etherscan_http_error":
          throw new Error(
            `Etherscan API responded with status ${(error as any).status}`
          );
        case "etherscan_rate_limit":
          throw new Error(
            "Etherscan API rate limit reached, please try again later"
          );
        case "etherscan_api_error":
          throw new Error(
            `Etherscan API error: ${(error as any).apiErrorMessage}`
          );
        case "etherscan_not_verified":
          throw new Error("This contract is not verified on Etherscan");
        default:
          throw new Error(`Etherscan error: ${error.message}`);
      }
    }
    throw error;
  }
};

export const processEtherscanResult = async (
  etherscanResult: EtherscanResult
): Promise<ProcessedEtherscanResult> => {
  try {
    let processedResult;

    if (EtherscanUtils.isVyperResult(etherscanResult)) {
      processedResult = await EtherscanUtils.processVyperResultFromEtherscan(
        etherscanResult
      );
    } else {
      processedResult =
        EtherscanUtils.processSolidityResultFromEtherscan(etherscanResult);
    }

    return {
      compilerVersion: processedResult.compilerVersion,
      contractName: processedResult.contractName,
      contractPath: processedResult.contractPath,
      jsonInput: processedResult.jsonInput,
    };
  } catch (error) {
    if (error instanceof EtherscanImportError) {
      // Convert EtherscanImportError to regular Error for compatibility
      throw new Error(error.message);
    }
    throw error;
  }
};
