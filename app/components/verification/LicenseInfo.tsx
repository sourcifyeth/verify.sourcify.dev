import React from "react";

export default function LicenseInfo() {
  return (
    <div>
      <label className="block text-base font-semibold text-gray-900 mb-2">License</label>
      <p className="text-sm text-gray-700">
        Licenses are per file and should be marked with{" "}
        <a
          href="https://spdx.dev/learn/handling-license-info/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cerulean-blue-600 hover:text-cerulean-blue-800 underline"
        >
          SPDX License
        </a>{" "}
        comments.
      </p>
    </div>
  );
}
