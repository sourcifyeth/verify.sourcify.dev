import type { ReactNode } from "react";
import { useChains } from "../contexts/ChainsContext";
import { Tooltip } from "react-tooltip";
import { useServerConfig } from "~/contexts/ServerConfigContext";
import { removeCurrentServerUrl } from "../utils/serverStorage";

interface PageLayoutProps {
  children: ReactNode;
  maxWidth?: "max-w-4xl" | "max-w-6xl";
  title?: string;
  subtitle?: string;
}

export default function PageLayout({ children, maxWidth = "max-w-4xl", title, subtitle }: PageLayoutProps) {
  const { loading, error, refetch } = useChains();
  const { serverUrl, setServerUrl, getDefaultServerUrls, setCustomServerUrls } = useServerConfig();

  const handleResetServerSettings = () => {
    // Clear custom server URLs
    setCustomServerUrls([]);

    // Reset to default server URL
    const defaultUrls = getDefaultServerUrls();
    setServerUrl(defaultUrls[0]);

    // Clear from localStorage
    removeCurrentServerUrl();

    // Refetch after reset
    refetch();
  };

  const renderHeader = () => {
    if (!title && !subtitle) {
      return null;
    }

    const envPrefix =
      import.meta.env.VITE_ENV && import.meta.env.VITE_ENV !== "production"
        ? `(${import.meta.env.VITE_ENV} environment) `
        : "";

    return (
      <div className="text-center p-4 md:p-8 border-b border-gray-200">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">{title}</h1>
        <p className="max-w-2xl mx-auto text-sm md:text-base text-gray-600">
          {envPrefix}
          {subtitle}
        </p>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center p-4 md:p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cerulean-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading supported chains...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-4 md:p-8">
          <div className="text-light-coral-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-gray-600 mb-4">Server URL: {serverUrl}</p>
          <div className="flex flex-col space-y-2 items-center">
            <button
              onClick={refetch}
              className="bg-cerulean-blue-500 text-white px-4 py-2 rounded-md hover:bg-cerulean-blue-600 focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:ring-offset-2"
            >
              Try Again
            </button>
            <button
              onClick={handleResetServerSettings}
              className="text-red-600 px-4 py-2 rounded-md hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 border border-red-200"
            >
              Reset Server Settings
            </button>
          </div>
        </div>
      );
    }

    return children;
  };

  return (
    <>
      <div className={`${maxWidth} mx-auto px-4 md:px-8 mt-6 md:mt-12`}>
        <div className="relative mt-4">
          <div className="absolute w-full h-full bg-cerulean-blue-500 rounded-lg -top-1" />
          <div className="relative bg-white shadow-lg rounded-lg">
            {renderHeader()}
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Global Tooltip */}
      <Tooltip
        id="global-tooltip"
        style={{ maxWidth: "300px", fontSize: "14px", zIndex: 1000 }}
        className="!bg-gray-900 !text-white !rounded-lg !shadow-lg"
      />
    </>
  );
}
