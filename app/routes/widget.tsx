import type { Route } from "./+types/widget";
import VerificationForm from "../components/VerificationForm";
import { useSearchParams } from "react-router";

export function meta({ }: Route.MetaArgs) {
  return [
    {
      title:
        (import.meta.env.VITE_ENV && import.meta.env.VITE_ENV !== "production"
          ? `(${import.meta.env.VITE_ENV}) `
          : "") + "verify.sourcify.dev - Widget",
    },
    {
      name: "description",
      content: "Verify your smart contracts with Sourcify",
    },
  ];
}

export default function Widget() {
  const [searchParams] = useSearchParams();
  const preselectedChainId = searchParams.get("chainId") || undefined;
  const preselectedAddress = searchParams.get("address") || undefined;

  return (
    <div className="h-screen flex justify-center">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-lg overflow-hidden h-full flex flex-col">
          <div className="flex-shrink-0 px-4 pt-1">
            <div className="flex items-center justify-center">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <img
                  src="/sourcify.png"
                  alt="Sourcify Logo"
                  className="h-5 w-auto mr-2"
                  width={20}
                  height={20}
                />
                <span className="text-gray-700 font-vt323 text-base">
                  verify.sourcify.dev
                </span>
              </a>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <VerificationForm preselectedChainId={preselectedChainId} preselectedAddress={preselectedAddress} />
          </div>
        </div>
      </div>
    </div>
  );
}
