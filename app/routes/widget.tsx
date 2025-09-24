import type { Route } from "./+types/widget";
import VerificationForm from "../components/VerificationForm";
import { Tooltip } from "react-tooltip";

export function meta({}: Route.MetaArgs) {
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
  return (
    <div className="min-h-screen flex items-center justify-center bg-cerulean-blue-50">
      <div className="w-full max-w-4xl">
        <div className="bg-white shadow-lg rounded-lg">
          <VerificationForm />
        </div>
      </div>

      {/* Global Tooltip */}
      <Tooltip
        id="global-tooltip"
        style={{ maxWidth: "300px", fontSize: "14px", zIndex: 1000 }}
        className="!bg-gray-900 !text-white !rounded-lg !shadow-lg"
      />
    </div>
  );
}
