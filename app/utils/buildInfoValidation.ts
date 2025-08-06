import type { SolidityVersion, VyperVersion } from "../contexts/CompilerVersionsContext";

interface BuildInfoInput {
  language: string;
  sources: Record<string, { content: string }>;
  settings: any;
  [key: string]: any; // Other fields that will be ignored
}

interface BuildInfoFile {
  solcVersion?: string;
  solcLongVersion?: string;
  input: BuildInfoInput;
  [key: string]: any; // Other fields that will be ignored
}

interface StandardJsonInput {
  language: string;
  sources: Record<string, { content: string }>;
  settings: any;
}

export interface BuildInfoParseResult {
  isValid: boolean;
  error?: string;
  standardJson?: StandardJsonInput;
  compilerVersion?: string;
}

/**
 * Validates that a build-info file has the required structure
 */
export function validateBuildInfoStructure(buildInfo: any): boolean {
  if (!buildInfo || typeof buildInfo !== 'object') {
    return false;
  }

  // Check for required top-level input field
  if (!buildInfo.input || typeof buildInfo.input !== 'object') {
    return false;
  }

  const input = buildInfo.input;

  // Check for required input fields
  if (!input.language || typeof input.language !== 'string') {
    return false;
  }

  if (!input.sources || typeof input.sources !== 'object') {
    return false;
  }

  if (!input.settings || typeof input.settings !== 'object') {
    return false;
  }

  return true;
}

/**
 * Extracts compiler version from build-info file
 * Checks solcLongVersion first, then falls back to solcVersion
 */
export function extractCompilerVersion(
  buildInfo: BuildInfoFile,
  availableVersions: (SolidityVersion | VyperVersion)[]
): string | null {
  // Try solcLongVersion first (can be short like "0.8.19" or long like "0.8.19+commit.7dd6d404")
  if (buildInfo.solcLongVersion) {
    const longVersion = buildInfo.solcLongVersion;
    
    // Try to find exact match first
    const exactMatch = availableVersions.find(v => {
      if ('version' in v) {
        return (v as SolidityVersion).version === longVersion;
      } else {
        return (v as VyperVersion).longVersion === longVersion;
      }
    });
    
    if (exactMatch) {
      return 'version' in exactMatch ? (exactMatch as SolidityVersion).version : (exactMatch as VyperVersion).longVersion;
    }
    
    // If longVersion is short (like "0.8.19"), try to find a match with that base version
    if (!longVersion.includes('+commit')) {
      const baseVersionMatch = availableVersions.find(v => {
        if ('version' in v) {
          return (v as SolidityVersion).version.startsWith(longVersion + '+commit');
        } else {
          return (v as VyperVersion).longVersion.startsWith(longVersion + '+commit');
        }
      });
      
      if (baseVersionMatch) {
        return 'version' in baseVersionMatch ? (baseVersionMatch as SolidityVersion).version : (baseVersionMatch as VyperVersion).longVersion;
      }
    }
  }
  
  // Fallback to solcVersion if solcLongVersion not found or not matched
  if (buildInfo.solcVersion) {
    const shortVersion = buildInfo.solcVersion;
    
    // Try to find a version that starts with this short version
    const match = availableVersions.find(v => {
      if ('version' in v) {
        return (v as SolidityVersion).version.startsWith(shortVersion);
      } else {
        return (v as VyperVersion).longVersion.startsWith(shortVersion);
      }
    });
    
    if (match) {
      return 'version' in match ? (match as SolidityVersion).version : (match as VyperVersion).longVersion;
    }
  }
  
  return null;
}

/**
 * Extracts standard JSON input from build-info file
 * Only includes language, sources, and settings fields
 */
export function extractStandardJson(buildInfo: BuildInfoFile): StandardJsonInput {
  const input = buildInfo.input;
  
  return {
    language: input.language,
    sources: input.sources,
    settings: input.settings,
  };
}

/**
 * Main function to parse and validate a build-info file
 */
export function parseBuildInfoFile(
  buildInfoContent: string,
  availableVersions: (SolidityVersion | VyperVersion)[]
): BuildInfoParseResult {
  try {
    const buildInfo: BuildInfoFile = JSON.parse(buildInfoContent);
    
    // Validate structure
    if (!validateBuildInfoStructure(buildInfo)) {
      return {
        isValid: false,
        error: "Invalid build-info file structure. Required fields: input.language, input.sources, input.settings",
      };
    }
    
    // Extract compiler version
    const compilerVersion = extractCompilerVersion(buildInfo, availableVersions);
    if (!compilerVersion) {
      return {
        isValid: false,
        error: "Could not match compiler version from build-info file with available versions",
      };
    }
    
    // Extract standard JSON
    const standardJson = extractStandardJson(buildInfo);
    
    return {
      isValid: true,
      standardJson,
      compilerVersion,
    };
  } catch (error) {
    return {
      isValid: false,
      error: "Invalid JSON format in build-info file",
    };
  }
}