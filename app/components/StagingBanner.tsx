import { useEffect, useState } from "react";

// Shown only on non-production deployments. Production builds set
// VITE_ENV to "production"; anything else (e.g. "staging") is non-production.
const isStaging = Boolean(import.meta.env.VITE_ENV) && import.meta.env.VITE_ENV !== "production";

export default function StagingBanner() {
  // Set on the client only to avoid an SSR/prerender hydration mismatch.
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  if (!isStaging) {
    return null;
  }

  return (
    <div className="w-full bg-cerulean-blue-500 text-white text-center font-medium py-3 px-4">
      🚧 You are on the <span className="font-bold">staging/dev</span> environment{" "}
      <span className="mx-1 text-xl align-middle">—</span>{" "}
      <span className="font-mono font-normal">{url}</span>
    </div>
  );
}
