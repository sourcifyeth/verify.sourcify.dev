import { useEffect, useRef, useState } from "react";
import { IoOpenOutline } from "react-icons/io5";
import type { ExternalVerifications } from "~/utils/sourcifyApi";
import {
  buildStatus,
  requestExternalVerifierStatus,
  type ExternalVerifierKey,
  type ExternalVerifierState,
  type ExternalVerifierStatus,
} from "~/utils/externalVerifiers";

const EXTERNAL_VERIFIER_LABELS: Record<ExternalVerifierKey, string> = {
  etherscan: "Etherscan",
  blockscout: "Blockscout",
  routescan: "Routescan",
};

const STATUS_BADGE_STYLES: Record<ExternalVerifierState, string> = {
  success: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
  unknown: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS: Record<ExternalVerifierState, string> = {
  success: "Verification successful",
  pending: "Verification pending",
  error: "Verification error",
  unknown: "Status unknown",
};

const DEFAULT_REFRESH_SECONDS = 3;

type ExternalVerifierStatusMap = Partial<Record<ExternalVerifierKey, ExternalVerifierStatus>>;

interface ExternalVerifierStatusesProps {
  verifications?: ExternalVerifications;
  refreshRateSeconds?: number;
}

const ExternalVerifierStatuses = ({
  verifications,
  refreshRateSeconds = DEFAULT_REFRESH_SECONDS,
}: ExternalVerifierStatusesProps) => {
  const [externalVerifierStatuses, setExternalVerifierStatuses] = useState<ExternalVerifierStatusMap>({});
  const externalVerifierStatusesRef = useRef<ExternalVerifierStatusMap>({});

  useEffect(() => {
    if (!verifications) {
      externalVerifierStatusesRef.current = {};
      setExternalVerifierStatuses({});
      return;
    }

    const verifierEntries = Object.entries(verifications).filter(
      ([, data]) => !!data
    ) as Array<[ExternalVerifierKey, ExternalVerifications[ExternalVerifierKey]]>;

    if (verifierEntries.length === 0) {
      externalVerifierStatusesRef.current = {};
      setExternalVerifierStatuses({});
      return;
    }

    const activeKeys = new Set<ExternalVerifierKey>(verifierEntries.map(([key]) => key));
    const preservedStatusesEntries = Object.entries(externalVerifierStatusesRef.current).filter(([key]) =>
      activeKeys.has(key as ExternalVerifierKey)
    );
    const preservedStatuses = Object.fromEntries(preservedStatusesEntries);
    externalVerifierStatusesRef.current = preservedStatuses;
    setExternalVerifierStatuses(preservedStatuses);

    let isCancelled = false;
    let timeoutId: number | null = null;

    const shouldFetchKey = (key: ExternalVerifierKey) => {
      const status = externalVerifierStatusesRef.current[key];
      if (!status) {
        return true;
      }
      const messageIndicatesPending =
        typeof status.message === "string" && status.message.toLowerCase().includes("pending");
      return status.state === "pending" || status.state === "unknown" || messageIndicatesPending;
    };

    const updateStatuses = async (): Promise<boolean> => {
      const keysToFetch = verifierEntries.filter(([key]) => shouldFetchKey(key));

      if (keysToFetch.length === 0) {
        return verifierEntries.some(([key]) => shouldFetchKey(key));
      }

      const results = await Promise.all(
        keysToFetch.map(async ([key, data]) => {
          const status = await requestExternalVerifierStatus(key, data);
          return [key, status] as const;
        })
      );

      if (isCancelled) {
        return false;
      }

      const next = { ...externalVerifierStatusesRef.current };
      results.forEach(([key, status]) => {
        next[key] = status;
      });

      externalVerifierStatusesRef.current = next;
      setExternalVerifierStatuses(next);

      return Object.values(next).some((status) => status.state === "pending" || status.state === "unknown");
    };

    const pollStatuses = async () => {
      const hasPending = await updateStatuses();
      if (isCancelled) return;
      if (hasPending) {
        timeoutId = window.setTimeout(pollStatuses, refreshRateSeconds * 1000);
      }
    };

    pollStatuses();

    return () => {
      isCancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [verifications, refreshRateSeconds]);

  if (!verifications || !Object.values(verifications).some((value) => !!value)) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 my-6 md:my-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 mb-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">Verification on other verifiers</h2>
        <p className="text-sm text-gray-500">Statuses refresh every {refreshRateSeconds} seconds.</p>
      </div>
      <div className="space-y-4">
        {Object.entries(verifications)
          .filter(([, value]) => !!value)
          .map(([key, verifierData]) => {
            const typedKey = key as ExternalVerifierKey;
            const label = EXTERNAL_VERIFIER_LABELS[typedKey] ?? key;
            const fallbackStatus = verifierData?.error
              ? buildStatus("error", verifierData.error)
              : verifierData?.verificationId
              ? buildStatus("pending", `Awaiting verifier response (${verifierData.verificationId})`)
              : buildStatus("unknown", "Waiting for verifier response");
            const status = externalVerifierStatuses[typedKey] ?? fallbackStatus;

            return (
              <div
                key={key}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-gray-200 rounded-lg p-4"
              >
                <div>
                  <p className="text-base md:text-lg font-semibold text-gray-900">{label}</p>
                  <p className="text-sm text-gray-600 break-words">{status.message}</p>
                  {verifierData?.verificationId && (
                    <p className="text-xs text-gray-500 mt-1 break-all">Verification ID: {verifierData.verificationId}</p>
                  )}
                  {verifierData?.explorerUrl && (
                    <a
                      href={verifierData.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-cerulean-blue-600 hover:text-cerulean-blue-800 mt-2"
                    >
                      View on explorer
                      <IoOpenOutline className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <span
                  className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${
                    STATUS_BADGE_STYLES[status.state]
                  }`}
                >
                  {STATUS_LABELS[status.state]}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default ExternalVerifierStatuses;
