import type { Route } from "./+types/home";
import PageLayout from "../components/PageLayout";
import VerificationForm from "../components/VerificationForm";
import RecentVerifications from "../components/verification/RecentVerifications";

export function meta({}: Route.MetaArgs) {
  return [
    {
      title:
        (import.meta.env.VITE_ENV && import.meta.env.VITE_ENV !== "production"
          ? `(${import.meta.env.VITE_ENV}) `
          : "") + "verify.sourcify.dev",
    },
    { name: "description", content: "Verify your smart contracts with Sourcify" },
  ];
}

export default function Home() {
  return (
    <div className="pb-12 bg-cerulean-blue-50 pt-1">
      <PageLayout title="Verify Smart Contracts">
        <>
          <VerificationForm />
          <div className="p-4 md:p-8 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <RecentVerifications />
          </div>
        </>
      </PageLayout>
    </div>
  );
}
