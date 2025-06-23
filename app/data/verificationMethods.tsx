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
  hardhat: "Use the Hardhat plugin for Sourcify verification. Run: npm install --save-dev @sourcify/hardhat-plugin",
  foundry: "Use the Foundry plugin for Sourcify verification. Add to foundry.toml: sourcify = true",
};
