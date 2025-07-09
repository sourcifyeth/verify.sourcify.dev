import React, { useState } from "react";
import { IoSettings, IoClose, IoAdd } from "react-icons/io5";
import { FaRegEdit, FaRegSave } from "react-icons/fa";
import { useServerConfig } from "../../contexts/ServerConfigContext";

export default function Settings() {
  const { serverUrl, setServerUrl, getDefaultServerUrls } = useServerConfig();
  const [showSettings, setShowSettings] = useState(false);
  const [customServerUrls, setCustomServerUrls] = useState<string[]>([]);
  const [editingCustomUrl, setEditingCustomUrl] = useState<string | null>(null);
  const [newCustomUrl, setNewCustomUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  const getAllServerUrls = () => {
    return [...getDefaultServerUrls(), ...customServerUrls];
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddCustomUrl = () => {
    const trimmedUrl = newCustomUrl.trim();

    // Clear previous errors
    setUrlError(null);

    if (!trimmedUrl) {
      setUrlError("Please enter a URL");
      return;
    }

    if (!isValidUrl(trimmedUrl)) {
      setUrlError("Please enter a valid URL (e.g., https://example.com)");
      return;
    }

    if (getAllServerUrls().includes(trimmedUrl)) {
      setUrlError("This URL is already in the list");
      return;
    }

    setCustomServerUrls([...customServerUrls, trimmedUrl]);
    setNewCustomUrl("");
    setUrlError(null);
  };

  const handleEditCustomUrl = (url: string) => {
    setEditingCustomUrl(url);
    setNewCustomUrl(url);
  };

  const handleSaveCustomUrl = () => {
    if (editingCustomUrl && newCustomUrl.trim()) {
      const updatedUrls = customServerUrls.map((url) => (url === editingCustomUrl ? newCustomUrl.trim() : url));
      setCustomServerUrls(updatedUrls);
      if (serverUrl === editingCustomUrl) {
        setServerUrl(newCustomUrl.trim());
      }
    }
    setEditingCustomUrl(null);
    setNewCustomUrl("");
  };

  const handleRemoveCustomUrl = (urlToRemove: string) => {
    setCustomServerUrls(customServerUrls.filter((url) => url !== urlToRemove));
    if (serverUrl === urlToRemove) {
      setServerUrl(getDefaultServerUrls()[0]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddCustomUrl();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCustomUrl(e.target.value);
    // Clear error when user starts typing
    if (urlError) {
      setUrlError(null);
    }
  };

  return (
    <div
      className={`bg-gray-50 border border-gray-200 transition-all duration-300 overflow-hidden ${
        showSettings ? "rounded-t-lg" : "rounded-lg"
      }`}
    >
      <div className="flex items-center justify-between py-1 px-2 sm:px-4">
        <div className="text-sm text-gray-700 min-w-0 flex-1 mr-2">
          <span className="font-medium">Sourcify Server:</span>{" "}
          <span className="font-mono truncate block sm:inline max-w-full sm:max-w-none">{serverUrl}</span>
        </div>
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
        >
          <IoSettings className="w-4 h-4" />
          <span className="hidden sm:inline">{showSettings ? "Close Settings" : "Open Settings"}</span>
        </button>
      </div>

      <div
        className={`border-t border-gray-200 bg-white rounded-b-lg transition-all duration-300 ease-in-out ${
          showSettings ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-2 sm:px-4 pb-4 sm:pb-6 pt-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Server Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Server URL</label>
              <select
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cerulean-blue-500 focus:border-cerulean-blue-500"
              >
                {getDefaultServerUrls().map((url) => (
                  <option key={url} value={url}>
                    {url} {url.includes("localhost") ? "(Dev)" : "(Default)"}
                  </option>
                ))}
                {customServerUrls.map((url) => (
                  <option key={url} value={url}>
                    {url} (Custom)
                  </option>
                ))}
              </select>
            </div>

            {customServerUrls.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Custom Server URLs</label>
                <div className="space-y-2">
                  {customServerUrls.map((url) => (
                    <div key={url} className="flex items-center space-x-2">
                      {editingCustomUrl === url ? (
                        <>
                          <input
                            type="text"
                            value={newCustomUrl}
                            onChange={(e) => setNewCustomUrl(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cerulean-blue-500 focus:border-cerulean-blue-500"
                            placeholder="Enter server URL"
                          />
                          <button
                            type="button"
                            onClick={handleSaveCustomUrl}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                          >
                            <FaRegSave className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCustomUrl(null);
                              setNewCustomUrl("");
                            }}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                          >
                            <IoClose className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded">
                            {url}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleEditCustomUrl(url)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          >
                            <FaRegEdit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomUrl(url)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          >
                            <IoClose className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Add Custom Server URL</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newCustomUrl}
                    onChange={handleInputChange}
                    className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-cerulean-blue-500 focus:border-cerulean-blue-500 ${
                      urlError ? "border-red-300 bg-red-50" : "border-gray-300"
                    }`}
                    placeholder="Enter custom server URL"
                    onKeyDown={handleKeyDown}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomUrl}
                    disabled={!newCustomUrl.trim()}
                    className="px-4 py-2 bg-cerulean-blue-600 text-white rounded-md hover:bg-cerulean-blue-700 focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <IoAdd className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
                {urlError && <p className="text-red-600 text-sm">{urlError}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
