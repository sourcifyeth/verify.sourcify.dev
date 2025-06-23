import React from "react";
import type {
  VerificationMethod,
  FrameworkMethod,
  VerificationMethods,
  FrameworkMessages,
} from "../types/verification";

export const flatteningWarning = (
  <span>
    Flattenning or modifying sources will change the metadata hash and will break{" "}
    <a
      href="https://docs.sourcify.dev/docs/exact-match-vs-match/"
      className="text-cerulean-blue-600 hover:text-cerulean-blue-700 underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      Exact Matches
    </a>
    . Always prefer standard JSON, metadata.json, or using the built-in verification commands in frameworks like Hardhat
    or Foundry.
  </span>
);

export const baseVerificationMethods: VerificationMethod[] = [
  {
    id: "single-file",
    title: "Single File",
    description: "Upload a single file or flattened sources",
    warning: flatteningWarning,
  },
  {
    id: "multiple-files",
    title: "Multiple Files",
    description: "Upload multiple files",
    warning: flatteningWarning,
  },
  {
    id: "std-json",
    title: "Std JSON",
    description: "Use standard JSON input format",
  },
];

export const solidityMetadataMethod: VerificationMethod = {
  id: "metadata-json",
  title: "Metadata.json",
  description: "Use Solidity's metadata.json output file",
  warning:
    "The metadata.json method will actually generate the std JSON behind the scenes when compiling, using the metadata JSON as input.",
};

export const verificationMethods: VerificationMethods = {
  solidity: [...baseVerificationMethods, solidityMetadataMethod],
  vyper: baseVerificationMethods,
};

export const frameworkMethods: FrameworkMethod[] = [
  {
    id: "hardhat",
    title: "Hardhat",
    description: "Use Hardhat's built-in verification",
    icon: "/hardhat.png",
  },
  {
    id: "foundry",
    title: "Foundry",
    description: "Use Foundry's built-in verification",
    icon: "/foundry.png",
  },
];

export const frameworkMessages: FrameworkMessages = {
  hardhat: (
    <div>
      <p className="mb-3 text-sm">
        <a
          href="https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify#verifying-on-sourcify"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cerulean-blue-600 hover:text-cerulean-blue-700 underline"
        >
          Hardhat Documentation →
        </a>
      </p>
      <p className="mb-3">Enable Sourcify in your hardhat.config.js:</p>
      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-3 overflow-x-auto">
        <pre className="text-sm">
          {`module.exports = {
  sourcify: {
    // Doesn't need an API key
    enabled: true
  }
};`}
        </pre>
      </div>
      <p className="mb-2">Then verify a contract:</p>
      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
        <pre className="text-sm">
          {`npx hardhat verify --network mainnet 0x1F98431c8aD98523631AE4a59f267346ea31F984`}
        </pre>
      </div>
    </div>
  ),
  foundry: (
    <div>
      <p className="mb-3 text-sm">
        <a
          href="https://book.getfoundry.sh/reference/forge/forge-verify-contract"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cerulean-blue-600 hover:text-cerulean-blue-700 underline"
        >
          Foundry Documentation →
        </a>
      </p>
      <p className="mb-2">Deploy and verify with Foundry:</p>
      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-3 overflow-x-auto">
        <pre className="text-sm">
          {`forge create --rpc-url <rpc-url> --private-key <private-key> src/MyContract.sol:MyContract --verify --verifier sourcify`}
        </pre>
      </div>
      <p className="mb-2">Or verify an already deployed contract:</p>
      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-3 overflow-x-auto">
        <pre className="text-sm">
          {`forge verify-contract --verifier sourcify --chain <chain-id> 0xB4239c86440d6C39d518D6457038cB404451529b MyContract`}
        </pre>
      </div>
      <p className="mb-2">Check if a contract is verified:</p>
      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
        <pre className="text-sm">
          {`forge verify-check 0x1F98431c8aD98523631AE4a59f267346ea31F984 --verifier sourcify`}
        </pre>
      </div>
    </div>
  ),
};
