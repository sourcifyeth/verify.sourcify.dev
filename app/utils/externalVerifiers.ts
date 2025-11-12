import {
  fetchEtherscanVerificationStatus,
  type EtherscanVerificationStatusResponse,
} from "./etherscanApi";
import { getEtherscanApiKey } from "./etherscanStorage";
import type { ExternalVerifications } from "./sourcifyApi";

export type ExternalVerifierKey = keyof ExternalVerifications;
export type ExternalVerifierState = "pending" | "success" | "error" | "unknown";

export interface ExternalVerifierStatus {
  state: ExternalVerifierState;
  message: string;
  lastUpdated: number;
}

export const buildStatus = (
  state: ExternalVerifierState,
  message: string
): ExternalVerifierStatus => ({
  state,
  message,
  lastUpdated: Date.now(),
});

const interpretExternalVerifierStatus = (
  payload: EtherscanVerificationStatusResponse
): ExternalVerifierStatus => {
  const result = payload.result?.trim();
  const message = result || payload.message?.trim() || "Status received";
  const isAlreadyVerified = result?.toLowerCase() === "already verified";

  if (payload.status === "1") {
    return buildStatus("success", message);
  }

  if (payload.status === "0") {
    return isAlreadyVerified
      ? buildStatus("success", message)
      : buildStatus("error", message);
  }

  return buildStatus("unknown", message);
};

export const requestExternalVerifierStatus = async (
  verifierKey: ExternalVerifierKey,
  verificationData?: ExternalVerifications[ExternalVerifierKey]
): Promise<ExternalVerifierStatus> => {
  if (!verificationData) {
    return buildStatus("unknown", "No verification data available");
  }

  if (verificationData.error) {
    return buildStatus("error", verificationData.error);
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

    if (verifierKey === "etherscan") {
      const apiKey = getEtherscanApiKey();
      if (!apiKey) {
        return buildStatus(
          "error",
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
