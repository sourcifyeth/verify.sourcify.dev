import React from "react";

interface VerificationWarningProps {
  children: React.ReactNode;
  type?: "warning" | "info";
}

export default function VerificationWarning({ children, type = "warning" }: VerificationWarningProps) {
  const styles = {
    warning: "bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800",
    info: "bg-blue-50 border-l-4 border-blue-400 text-blue-800",
  };

  return <div className={`mt-4 p-3 ${styles[type]} text-sm rounded`}>{children}</div>;
}
