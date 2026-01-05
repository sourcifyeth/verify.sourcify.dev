import { id as keccak256str } from "ethers";

export interface MetadataSource {
  keccak256: string;
  content?: string;
  license?: string;
  urls?: string[];
}

export interface SourceValidationResult {
  expectedFileName: string;
  matchedFileName?: string; // Actual uploaded file name that matched the hash
  status: "found" | "missing" | "embedded";
  expectedHash: string;
  actualHash?: string;
  isValid: boolean;
  fileSize?: number;
  content?: string; // For embedded sources
}

export interface ValidationSummary {
  allRequiredFound: boolean;
  missingCount: number;
  unnecessaryCount: number;
  sources: SourceValidationResult[];
  unnecessaryFiles: Array<{
    fileName: string;
    actualHash: string;
    fileSize: number;
  }>;
  message: string;
}

/**
 * Calculate keccak256 hash of file content
 */
async function calculateFileHash(file: File): Promise<string> {
  const content = await file.text();
  return keccak256str(content);
}

/**
 * Calculate keccak256 hash of string content
 */
function calculateStringHash(content: string): string {
  return keccak256str(content);
}

/**
 * Validate uploaded files against metadata.json sources
 */
export async function validateMetadataSources(metadataFile: File, uploadedFiles: File[]): Promise<ValidationSummary> {
  try {
    // Parse metadata.json
    const metadataContent = await metadataFile.text();
    let metadata: any;
    try {
      metadata = JSON.parse(metadataContent);
    } catch (error) {
      throw new Error("Error parsing metadata.json: " + error);
    }

    if (!metadata.sources || typeof metadata.sources !== "object") {
      throw new Error("Invalid metadata.json: missing or invalid sources field");
    }

    const metadataSources: Record<string, MetadataSource> = metadata.sources;
    const sourceValidations: SourceValidationResult[] = [];

    // Calculate hashes for all uploaded files
    const uploadedFileHashes = new Map<string, { file: File; hash: string }>();
    for (const file of uploadedFiles) {
      const hash = await calculateFileHash(file);
      uploadedFileHashes.set(hash, { file, hash });
    }

    // Track which uploaded files have been matched
    const matchedUploadedFiles = new Set<string>();

    // Validate each source in metadata
    for (const [expectedFileName, sourceInfo] of Object.entries(metadataSources)) {
      const expectedHash = sourceInfo.keccak256;

      if (sourceInfo.content) {
        // Source is embedded in metadata
        const actualHash = calculateStringHash(sourceInfo.content);
        sourceValidations.push({
          expectedFileName,
          status: "embedded",
          expectedHash,
          actualHash,
          isValid: actualHash === expectedHash,
          content: sourceInfo.content,
        });
      } else {
        // Source needs to be provided as uploaded file - match by hash
        const matchedFileData = uploadedFileHashes.get(expectedHash);

        if (matchedFileData) {
          matchedUploadedFiles.add(expectedHash);
          sourceValidations.push({
            expectedFileName,
            matchedFileName: matchedFileData.file.name,
            status: "found",
            expectedHash,
            actualHash: matchedFileData.hash,
            isValid: true, // Hash matches by definition
            fileSize: matchedFileData.file.size,
          });
        } else {
          sourceValidations.push({
            expectedFileName,
            status: "missing",
            expectedHash,
            isValid: false,
          });
        }
      }
    }

    // Find unnecessary uploaded files (hashes not in metadata)
    const unnecessaryFiles: Array<{ fileName: string; actualHash: string; fileSize: number }> = [];
    for (const [hash, fileData] of uploadedFileHashes) {
      if (!matchedUploadedFiles.has(hash)) {
        unnecessaryFiles.push({
          fileName: fileData.file.name,
          actualHash: hash,
          fileSize: fileData.file.size,
        });
      }
    }

    // Calculate summary
    const missingCount = sourceValidations.filter((s) => s.status === "missing").length;
    const invalidHashCount = sourceValidations.filter((s) => !s.isValid).length;
    const unnecessaryCount = unnecessaryFiles.length;
    const allRequiredFound = missingCount === 0 && invalidHashCount === 0;

    // Generate message
    let message: string;
    if (allRequiredFound && unnecessaryCount === 0) {
      message = "✅ All required source files provided with matching hashes";
    } else {
      const messages: string[] = [];
      if (missingCount > 0) {
        messages.push(`${missingCount} source file(s) missing`);
      }
      if (invalidHashCount > 0) {
        messages.push(`${invalidHashCount} file(s) have incorrect content/hash`);
      }
      if (unnecessaryCount > 0) {
        messages.push(`${unnecessaryCount} unnecessary file(s) provided`);
      }
      message = `⚠️ Issues found: ${messages.join(", ")}`;
    }

    return {
      allRequiredFound,
      missingCount,
      unnecessaryCount,
      sources: sourceValidations,
      unnecessaryFiles,
      message,
    };
  } catch (error) {
    throw new Error(`Failed to validate metadata sources: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Build sources object for metadata API submission
 */
export async function buildMetadataSubmissionSources(
  metadataFile: File,
  uploadedFiles: File[]
): Promise<{ sources: Record<string, string>; metadata: any }> {
  const validation = await validateMetadataSources(metadataFile, uploadedFiles);

  if (!validation.allRequiredFound) {
    throw new Error("Cannot submit: not all required sources are provided with valid hashes");
  }

  // Parse metadata
  const metadataContent = await metadataFile.text();
  const metadata = JSON.parse(metadataContent);

  // Build sources object using hash-based matching
  const sources: Record<string, string> = {};

  // Calculate hashes for all uploaded files
  const uploadedFileHashes = new Map<string, File>();
  for (const file of uploadedFiles) {
    const hash = await calculateFileHash(file);
    uploadedFileHashes.set(hash, file);
  }

  for (const [fileName, sourceInfo] of Object.entries(metadata.sources as Record<string, MetadataSource>)) {
    if (sourceInfo.content) {
      // Use embedded content
      sources[fileName] = sourceInfo.content;
    } else {
      // Find uploaded file by hash
      const matchedFile = uploadedFileHashes.get(sourceInfo.keccak256);
      if (!matchedFile) {
        throw new Error(`Missing required source file for: ${fileName} (hash: ${sourceInfo.keccak256})`);
      }
      sources[fileName] = await matchedFile.text();
    }
  }

  return { sources, metadata };
}
