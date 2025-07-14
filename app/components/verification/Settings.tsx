import React, { useState, useEffect } from "react";
import { IoSettings, IoClose, IoAdd, IoEye, IoEyeOff } from "react-icons/io5";
import { FaRegEdit, FaRegSave } from "react-icons/fa";
import { useServerConfig } from "../../contexts/ServerConfigContext";
import { getEtherscanApiKey, setEtherscanApiKey, removeEtherscanApiKey } from "../../utils/etherscanStorage";

export default function Settings() {
  const { serverUrl, setServerUrl, getDefaultServerUrls } = useServerConfig();
  const [showSettings, setShowSettings] = useState(false);
  const [customServerUrls, setCustomServerUrls] = useState<string[]>([]);
  const [editingCustomUrl, setEditingCustomUrl] = useState<string | null>(null);
  const [newCustomUrl, setNewCustomUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  // Etherscan API key state
  const [etherscanApiKey, setEtherscanApiKeyState] = useState<string>("");
  const [showEtherscanApiKey, setShowEtherscanApiKey] = useState(false);
  const [etherscanApiKeyError, setEtherscanApiKeyError] = useState<string | null>(null);
  const [isEditingApiKey, setIsEditingApiKey] = useState(false);
  const [editingApiKey, setEditingApiKey] = useState<string>("");

  // Load Etherscan API key on component mount
  useEffect(() => {
    const storedApiKey = getEtherscanApiKey();
    if (storedApiKey) {
      setEtherscanApiKeyState(storedApiKey);
    }
  }, []);

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

  const handleEditApiKey = () => {
    setIsEditingApiKey(true);
    setEditingApiKey(etherscanApiKey);
    setEtherscanApiKeyError(null);
  };

  const handleCancelEditApiKey = () => {
    setIsEditingApiKey(false);
    setEditingApiKey("");
    setEtherscanApiKeyError(null);
  };

  const handleEditingApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditingApiKey(value);

    // Clear error when user starts typing
    if (etherscanApiKeyError) {
      setEtherscanApiKeyError(null);
    }
  };

  const handleSaveEtherscanApiKey = () => {
    const trimmedKey = editingApiKey.trim();

    if (trimmedKey === "") {
      removeEtherscanApiKey();
      setEtherscanApiKeyState("");
    } else {
      setEtherscanApiKey(trimmedKey);
      setEtherscanApiKeyState(trimmedKey);
    }

    setIsEditingApiKey(false);
    setEditingApiKey("");
    setEtherscanApiKeyError(null);
  };

  const handleRemoveEtherscanApiKey = () => {
    removeEtherscanApiKey();
    setEtherscanApiKeyState("");
    setEtherscanApiKeyError(null);
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 4) {
      return "*".repeat(key.length);
    }
    return key.substring(0, 4) + "*".repeat(key.length - 4);
  };

  return (
    <div
      className={`bg-gray-50 border border-gray-200 transition-all duration-300 overflow-hidden ${
        showSettings ? "rounded-t-lg" : "rounded-lg"
      }`}
    >
      <div className="flex items-center justify-between py-1 px-2 md:px-4">
        <div className="text-sm text-gray-700 min-w-0 flex-1 mr-2">
          <span className="font-medium">Sourcify Server:</span>{" "}
          <span className="font-mono truncate block md:inline max-w-full md:max-w-none">{serverUrl}</span>
        </div>
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center space-x-1 md:space-x-2 px-2 md:px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
        >
          <IoSettings className="w-4 h-4" />
          <span className="hidden md:inline">{showSettings ? "Close Settings" : "Open Settings"}</span>
        </button>
      </div>

      <div
        className={`border-t border-gray-200 bg-white rounded-b-lg transition-all duration-300 ease-in-out ${
          showSettings ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-2 md:px-4 pb-4 md:pb-6 pt-4">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Server Settings</h3>
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

          <div className="border-t border-gray-200 pt-4 mt-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">API Keys</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="inline-flex items-center">
                    <img src="/etherscan.webp" alt="Etherscan" className="w-4 h-4 mx-1" />
                    Etherscan API Key
                  </span>
                  <p className="text-xs text-gray-500">Saved in the browser and not sent to Sourcify servers.</p>
                </label>
                <div className="space-y-2">
                  {isEditingApiKey ? (
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 relative">
                        <input
                          type={showEtherscanApiKey ? "text" : "password"}
                          value={editingApiKey}
                          onChange={handleEditingApiKeyChange}
                          className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-cerulean-blue-500 focus:border-cerulean-blue-500 ${
                            etherscanApiKeyError ? "border-red-300 bg-red-50" : "border-gray-300"
                          }`}
                          placeholder="Enter your Etherscan API key"
                        />
                        <button
                          type="button"
                          onClick={() => setShowEtherscanApiKey(!showEtherscanApiKey)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showEtherscanApiKey ? <IoEyeOff className="w-4 h-4" /> : <IoEye className="w-4 h-4" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveEtherscanApiKey}
                        className="px-4 py-2 bg-cerulean-blue-600 text-white rounded-md hover:bg-cerulean-blue-700 focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:ring-offset-2 flex items-center space-x-2"
                      >
                        <FaRegSave className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditApiKey}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center space-x-2"
                      >
                        <IoClose className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="flex-1 text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded">
                        {etherscanApiKey ? (
                          showEtherscanApiKey ? (
                            etherscanApiKey
                          ) : (
                            maskApiKey(etherscanApiKey)
                          )
                        ) : (
                          <span className="text-gray-500">No API key set</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowEtherscanApiKey(!showEtherscanApiKey)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                        disabled={!etherscanApiKey}
                      >
                        {showEtherscanApiKey ? <IoEyeOff className="w-4 h-4" /> : <IoEye className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={handleEditApiKey}
                        className="px-4 py-2 bg-cerulean-blue-600 text-white rounded-md hover:bg-cerulean-blue-700 focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:ring-offset-2 flex items-center space-x-2"
                      >
                        <FaRegEdit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      {etherscanApiKey && (
                        <button
                          type="button"
                          onClick={handleRemoveEtherscanApiKey}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center space-x-2"
                        >
                          <IoClose className="w-4 h-4" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  )}
                  {etherscanApiKeyError && <p className="text-red-600 text-sm">{etherscanApiKeyError}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
