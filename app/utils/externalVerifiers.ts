import {
  fetchEtherscanVerificationStatus,
  type EtherscanVerificationStatusResponse,
} from "./etherscanApi";
import { getEtherscanApiKey } from "./etherscanStorage";
import type { ExternalVerifications } from "./sourcifyApi";

export type ExternalVerifierKey = keyof ExternalVerifications;
export type ExternalVerifierState =
  | "pending"
  | "success"
  | "error"
  | "no_api_key"
  | "expired"
  | "already_verified"
  | "unknown";
export type ExternalVerifierContractState =
  | "verified"
  | "not_verified"
  | "error"
  | "no_api_key"
  | "unknown";

export interface ExternalVerifierStatus {
  state: ExternalVerifierState;
  message: string;
  lastUpdated: number;
}

export interface ExternalVerifierContractStatus {
  state: ExternalVerifierContractState;
  message: string;
  lastUpdated: number;
}

interface ExternalVerifierIcon {
  src: string;
  alt: string;
  className?: string;
}

interface ExternalVerifierMetadata {
  label: string;
  icon?: ExternalVerifierIcon;
}

export const EXTERNAL_VERIFIER_METADATA: Record<
  ExternalVerifierKey,
  ExternalVerifierMetadata
> = {
  etherscan: {
    label: "Etherscan",
    icon: {
      src: "/etherscan.webp",
      alt: "Etherscan",
      className: "w-5 h-5 bg-white p-[1px] rounded-full",
    },
  },
  blockscout: {
    label: "Blockscout",
    icon: {
      src: "/blockscout.png",
      alt: "Blockscout",
      className: "w-5 h-5 bg-white p-[1px]",
    },
  },
  routescan: {
    label: "Routescan",
    icon: {
      src: "/routescan.png",
      alt: "Routescan",
      className: "w-5 h-5 bg-white p-[1px] rounded-full",
    },
  },
};

const EXTERNAL_VERIFIER_EXPIRATION_MINUTES: Partial<
  Record<ExternalVerifierKey, number>
> = {
  routescan: 24,
};

export const buildStatus = (
  state: ExternalVerifierState,
  message: string
): ExternalVerifierStatus => ({
  state,
  message,
  lastUpdated: Date.now(),
});

export const buildContractStatus = (
  state: ExternalVerifierContractState,
  message: string
): ExternalVerifierContractStatus => ({
  state,
  message,
  lastUpdated: Date.now(),
});

const interpretExternalVerifierStatus = (
  payload: EtherscanVerificationStatusResponse
): ExternalVerifierStatus => {
  const result = payload.result?.trim();
  const lowerResult = result?.toLowerCase();

  if (lowerResult) {
    if (lowerResult.startsWith("fail - unable to verify")) {
      return buildStatus("error", result);
    }

    if (lowerResult === "pending in queue") {
      return buildStatus("pending", result);
    }

    if (lowerResult === "pass - verified") {
      return buildStatus("success", result);
    }

    if (lowerResult === "already verified") {
      return buildStatus("already_verified", result);
    }

    if (lowerResult === "unknown uid") {
      return buildStatus("error", result);
    }
  }

  if (payload.status === "1" || payload.message.startsWith("ok")) {
    return buildStatus("success", result);
  }

  if (payload.status === "0") {
    return buildStatus("error", result);
  }

  return buildStatus("unknown", result);
};

interface ExternalVerifierContractStatusResponse {
  status?: string;
  result?: unknown;
}

const interpretExternalVerifierContractStatus = (
  payload: ExternalVerifierContractStatusResponse
): ExternalVerifierContractStatus => {
  if (payload.status === "1") {
    return buildContractStatus("verified", "Contract verified");
  }

  if (payload.status === "0") {
    return buildContractStatus("not_verified", "Contract not verified");
  }

  return buildContractStatus(
    "unknown",
    "Contract verification status unavailable"
  );
};

const isExternalVerifierExpired = (
  verifierKey: ExternalVerifierKey,
  jobFinishTime?: string
): boolean => {
  const expirationMinutes = EXTERNAL_VERIFIER_EXPIRATION_MINUTES[verifierKey];
  if (!expirationMinutes) return false;

  if (!jobFinishTime) return false;

  const finishedAtMs = Date.parse(jobFinishTime);
  if (Number.isNaN(finishedAtMs)) return false;

  const elapsedMinutes = (Date.now() - finishedAtMs) / (60 * 1000);
  return elapsedMinutes >= expirationMinutes;
};

export const requestExternalVerifierStatus = async (
  verifierKey: ExternalVerifierKey,
  verificationData?: ExternalVerifications[ExternalVerifierKey],
  jobFinishTime?: string
): Promise<ExternalVerifierStatus> => {
  if (!verificationData) {
    return buildStatus("unknown", "No verification data available");
  }

  if (verificationData.error) {
    return buildStatus("error", verificationData.error);
  }

  if (verificationData.verificationId === "VERIFIER_ALREADY_VERIFIED") {
    return buildStatus("already_verified", "Already verified");
  }

  if (isExternalVerifierExpired(verifierKey, jobFinishTime)) {
    return buildStatus(
      "expired",
      `Status expired after ${EXTERNAL_VERIFIER_EXPIRATION_MINUTES[verifierKey]} minutes`
    );
  }

  if (!verificationData.statusUrl) {
    if (verificationData.verificationId) {
      return buildStatus(
        "pending",
        `Awaiting verifier response (${verificationData.verificationId})`
      );
    }
    return buildStatus("unknown", "No status URL provided");
  }

  try {
    let payload: EtherscanVerificationStatusResponse;

    // Special case for etherscan in which we need
    // to pass the EtherscanKey to check the verification result
    if (verifierKey === "etherscan") {
      const apiKey = getEtherscanApiKey();
      if (!apiKey) {
        return buildStatus(
          "no_api_key",
          "Add your Etherscan API key in Settings to fetch the status."
        );
      }
      payload = await fetchEtherscanVerificationStatus(
        verificationData.statusUrl,
        apiKey
      );
    } else {
      const response = await fetch(verificationData.statusUrl);
      const rawBody = await response.text();

      if (!response.ok) {
        throw new Error(
          rawBody || `Status request failed (${response.status})`
        );
      }

      try {
        payload = JSON.parse(rawBody) as EtherscanVerificationStatusResponse;
      } catch {
        throw new Error("Unexpected status response format");
      }
    }

    return interpretExternalVerifierStatus(payload);
  } catch (err) {
    return buildStatus(
      "error",
      err instanceof Error ? err.message : "Failed to fetch status"
    );
  }
};

export const requestExternalVerifierContract = async (
  verifierKey: ExternalVerifierKey,
  verificationData?: ExternalVerifications[ExternalVerifierKey]
): Promise<ExternalVerifierContractStatus> => {
  if (!verificationData) {
    return buildContractStatus("unknown", "No verification data available");
  }

  if (verificationData.error) {
    return buildContractStatus("not_verified", verificationData.error);
  }

  if (verificationData.verificationId === "VERIFIER_ALREADY_VERIFIED") {
    return buildContractStatus("verified", "Already verified");
  }

  if (!verificationData.contractApiUrl) {
    return buildContractStatus("unknown", "No contract status URL provided");
  }

  try {
    let payload: ExternalVerifierContractStatusResponse;

    if (verifierKey === "etherscan") {
      const apiKey = getEtherscanApiKey();
      if (!apiKey) {
        return buildContractStatus(
          "no_api_key",
          "Add your Etherscan API key in Settings to fetch the contract status."
        );
      }
      const url = new URL(verificationData.contractApiUrl);
      url.searchParams.set("apikey", apiKey);
      const response = await fetch(url.toString());
      const rawBody = await response.text();

      if (!response.ok) {
        throw new Error(
          rawBody || `Contract status request failed (${response.status})`
        );
      }

      try {
        payload = JSON.parse(rawBody) as ExternalVerifierContractStatusResponse;
      } catch {
        throw new Error("Unexpected contract status response format");
      }
    } else {
      const response = await fetch(verificationData.contractApiUrl);
      const rawBody = await response.text();

      if (!response.ok) {
        throw new Error(
          rawBody || `Contract status request failed (${response.status})`
        );
      }

      try {
        payload = JSON.parse(rawBody) as ExternalVerifierContractStatusResponse;
      } catch {
        throw new Error("Unexpected contract status response format");
      }
    }

    return interpretExternalVerifierContractStatus(payload);
  } catch (err) {
    return buildContractStatus(
      "error",
      err instanceof Error
        ? err.message
        : "Failed to fetch contract verification status"
    );
  }
};
