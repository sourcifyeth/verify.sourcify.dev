import { useCallback, useEffect, useRef, useState } from "react";
import { IoOpenOutline } from "react-icons/io5";
import type { ExternalVerifications } from "~/utils/sourcifyApi";
import {
  buildStatus,
  buildContractStatus,
  requestExternalVerifierContract,
  requestExternalVerifierStatus,
  type ExternalVerifierContractState,
  type ExternalVerifierContractStatus,
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
  no_api_key: "bg-gray-100 text-grey-800",
  already_verified: "bg-green-50 text-grey-600",
};

const STATUS_LABELS: Record<ExternalVerifierState, string> = {
  success: "Successful",
  pending: "Pending",
  error: "Error",
  unknown: "Status unknown",
  no_api_key: "Missing API key",
  already_verified: "Already verified",
};

const CONTRACT_STATUS_BADGE_STYLES: Record<ExternalVerifierContractState, string> = {
  verified: "bg-green-100 text-green-800",
  not_verified: "bg-red-100 text-red-800",
  error: "bg-red-100 text-red-800",
  unknown: "bg-gray-100 text-gray-800",
  no_api_key: "bg-gray-100 text-grey-800",
};

const CONTRACT_STATUS_LABELS: Record<ExternalVerifierContractState, string> = {
  verified: "Verified",
  not_verified: "Not verified",
  error: "Contract status error",
  unknown: "Status unknown",
  no_api_key: "Missing API key",
};

const DEFAULT_REFRESH_SECONDS = 3;

type ExternalVerifierStatusMap = Partial<Record<ExternalVerifierKey, ExternalVerifierStatus>>;
type ExternalVerifierContractStatusMap = Partial<Record<ExternalVerifierKey, ExternalVerifierContractStatus>>;

interface ExternalVerifierStatusesProps {
  verifications?: ExternalVerifications;
  refreshRateSeconds?: number;
}

const ExternalVerifierStatuses = ({
  verifications,
  refreshRateSeconds = DEFAULT_REFRESH_SECONDS,
}: ExternalVerifierStatusesProps) => {
  const [externalVerifierStatuses, setExternalVerifierStatuses] = useState<ExternalVerifierStatusMap>({});
  const [externalVerifierContractStatuses, setExternalVerifierContractStatuses] =
    useState<ExternalVerifierContractStatusMap>({});
  const [countdown, setCountdown] = useState<number | null>(null);
  const externalVerifierStatusesRef = useRef<ExternalVerifierStatusMap>({});
  const externalVerifierContractStatusesRef = useRef<ExternalVerifierContractStatusMap>({});
  const refreshTimeoutIdRef = useRef<number | null>(null);
  const countdownIntervalIdRef = useRef<number | null>(null);

  const clearCountdownTimers = useCallback(() => {
    if (refreshTimeoutIdRef.current) {
      window.clearTimeout(refreshTimeoutIdRef.current);
      refreshTimeoutIdRef.current = null;
    }
    if (countdownIntervalIdRef.current) {
      window.clearInterval(countdownIntervalIdRef.current);
      countdownIntervalIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!verifications) {
      externalVerifierStatusesRef.current = {};
      externalVerifierContractStatusesRef.current = {};
      setExternalVerifierStatuses({});
      setExternalVerifierContractStatuses({});
      clearCountdownTimers();
      setCountdown(null);
      return;
    }

    const verifierEntries = Object.entries(verifications).filter(
      ([, data]) => !!data
    ) as Array<[ExternalVerifierKey, ExternalVerifications[ExternalVerifierKey]]>;

    if (verifierEntries.length === 0) {
      externalVerifierStatusesRef.current = {};
      externalVerifierContractStatusesRef.current = {};
      setExternalVerifierStatuses({});
      setExternalVerifierContractStatuses({});
      clearCountdownTimers();
      setCountdown(null);
      return;
    }

    const activeKeys = new Set<ExternalVerifierKey>(verifierEntries.map(([key]) => key));
    const preservedStatusesEntries = Object.entries(externalVerifierStatusesRef.current).filter(([key]) =>
      activeKeys.has(key as ExternalVerifierKey)
    );
    const preservedStatuses = Object.fromEntries(preservedStatusesEntries);
    externalVerifierStatusesRef.current = preservedStatuses;
    setExternalVerifierStatuses(preservedStatuses);
    const preservedContractStatusesEntries = Object.entries(externalVerifierContractStatusesRef.current).filter(
      ([key]) => activeKeys.has(key as ExternalVerifierKey)
    );
    const preservedContractStatuses = Object.fromEntries(preservedContractStatusesEntries);
    externalVerifierContractStatusesRef.current = preservedContractStatuses;
    setExternalVerifierContractStatuses(preservedContractStatuses);

    let isCancelled = false;
    clearCountdownTimers();

    const shouldFetchKey = (
      key: ExternalVerifierKey,
      data: ExternalVerifications[ExternalVerifierKey]
    ) => {
      const status = externalVerifierStatusesRef.current[key];
      const contractStatus = externalVerifierContractStatusesRef.current[key];
      const messageIndicatesPending =
        typeof status?.message === "string" && status.message.toLowerCase().includes("pending");
      const needsVerificationStatus =
        !status || status.state === "pending" || status.state === "unknown" || messageIndicatesPending;
      const hasContractApiUrl = Boolean(data?.contractApiUrl);
      const needsContractStatus =
        hasContractApiUrl && (!contractStatus || contractStatus.state === "unknown");
      return needsVerificationStatus || needsContractStatus;
    };

    const updateStatuses = async (): Promise<boolean> => {
      const keysToFetch = verifierEntries.filter(([key, data]) => shouldFetchKey(key, data));

      if (keysToFetch.length === 0) {
        return verifierEntries.some(([key, data]) => shouldFetchKey(key, data));
      }

      const results = await Promise.all(
        keysToFetch.map(async ([key, data]) => {
          const [status, contractStatus] = await Promise.all([
            requestExternalVerifierStatus(key, data),
            requestExternalVerifierContract(key, data),
          ]);
          return [key, status, contractStatus] as const;
        })
      );

      if (isCancelled) {
        return false;
      }

      const next = { ...externalVerifierStatusesRef.current };
      const nextContractStatuses = { ...externalVerifierContractStatusesRef.current };
      results.forEach(([key, status, contractStatus]) => {
        next[key] = status;
        nextContractStatuses[key] = contractStatus;
      });

      externalVerifierStatusesRef.current = next;
      externalVerifierContractStatusesRef.current = nextContractStatuses;
      setExternalVerifierStatuses(next);
      setExternalVerifierContractStatuses(nextContractStatuses);

      return verifierEntries.some(([key, data]) => shouldFetchKey(key, data));
    };

    const startCountdown = () => {
      setCountdown(refreshRateSeconds);
      if (countdownIntervalIdRef.current) {
        window.clearInterval(countdownIntervalIdRef.current);
      }
      countdownIntervalIdRef.current = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            if (countdownIntervalIdRef.current) {
              window.clearInterval(countdownIntervalIdRef.current);
              countdownIntervalIdRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const scheduleNextPoll = () => {
      if (isCancelled) return;
      if (refreshTimeoutIdRef.current) {
        window.clearTimeout(refreshTimeoutIdRef.current);
      }
      startCountdown();
      refreshTimeoutIdRef.current = window.setTimeout(() => {
        setCountdown(null);
        pollStatuses();
      }, refreshRateSeconds * 1000);
    };

    const pollStatuses = async () => {
      const hasPending = await updateStatuses();
      if (isCancelled) return;
      if (hasPending) {
        scheduleNextPoll();
      } else {
        clearCountdownTimers();
        setCountdown(null);
      }
    };

    pollStatuses();

    return () => {
      isCancelled = true;
      clearCountdownTimers();
    };
  }, [verifications, refreshRateSeconds, clearCountdownTimers]);

  if (!verifications || !Object.values(verifications).some((value) => !!value)) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 my-6 md:my-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4 mb-4">
        <div className="space-y-1">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">Other Verifiers</h2>
          <p className="text-sm text-gray-600">Sourcify automatically shares contracts with other known verifiers</p>
        </div>
        {countdown !== null && (
          <p className="text-sm text-gray-500 text-right">
            Next refresh in: <span className="font-mono font-medium">{countdown}</span> seconds
          </p>
        )}
      </div>
      <div className="space-y-4">
        {Object.entries(verifications)
          .filter(([, value]) => !!value)
          .sort(([aKey], [bKey]) =>
            (EXTERNAL_VERIFIER_LABELS[aKey as ExternalVerifierKey] ?? aKey).localeCompare(
              EXTERNAL_VERIFIER_LABELS[bKey as ExternalVerifierKey] ?? bKey
            )
          )
          .map(([key, verifierData]) => {
            const typedKey = key as ExternalVerifierKey;
            const label = EXTERNAL_VERIFIER_LABELS[typedKey] ?? key;
            const isAlreadyVerified = verifierData?.verificationId === "VERIFIER_ALREADY_VERIFIED";
            const fallbackStatus = verifierData?.error
              ? buildStatus("error", verifierData.error)
              : verifierData?.verificationId
              ? buildStatus("pending", `Awaiting verifier response (${verifierData.verificationId})`)
              : buildStatus("unknown", "Waiting for verifier response");
            const status = externalVerifierStatuses[typedKey] ?? fallbackStatus;
            const fallbackContractStatus = verifierData?.error
              ? buildContractStatus("not_verified", verifierData.error)
              : isAlreadyVerified
              ? buildContractStatus("verified", "Already verified")
              : verifierData?.contractApiUrl
              ? buildContractStatus("unknown", "Checking contract verification status")
              : buildContractStatus("unknown", "No contract verification status available");
            const contractStatus =
              externalVerifierContractStatuses[typedKey] ?? fallbackContractStatus;

                        return (
              <div
                key={key}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 md:gap-6">
                  <div className="space-y-1">
                    <p className="text-base md:text-lg font-semibold text-gray-900">{label}</p>
                    {verifierData?.verificationId && (
                      <p className="text-xs text-gray-500 break-all">
                        Verification ID: {verifierData.verificationId}
                      </p>
                    )}
                    {verifierData?.explorerUrl && (
                      <a
                        href={`${verifierData.explorerUrl}#code`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-cerulean-blue-600 hover:text-cerulean-blue-800 mt-2"
                      >
                        View contract
                        <IoOpenOutline className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  <div className="md:pl-4 md:min-w-[260px] w-full md:w-auto" style={{"minWidth": "280px"}}>
                    <div className=" rounded-lg p-3 md:p-4">
                      <div className="grid grid-cols-2 gap-3 text-xs font-semibold uppercase text-gray-700 tracking-wide">
                        <div className="text-center">Verification</div>
                        <div className="text-center">Contract</div>
                        <div className="flex justify-center">
                          <span
                            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${
                              STATUS_BADGE_STYLES[status.state]
                            }`}
                          >
                            {STATUS_LABELS[status.state]}
                          </span>
                        </div>
                        <div className="flex justify-center">
                          <span
                            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${
                              CONTRACT_STATUS_BADGE_STYLES[contractStatus.state]
                            }`}
                          >
                            {CONTRACT_STATUS_LABELS[contractStatus.state]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default ExternalVerifierStatuses;
