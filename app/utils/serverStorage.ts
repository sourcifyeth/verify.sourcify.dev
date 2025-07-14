import { useState, useEffect } from "react";

const CURRENT_SERVER_URL_STORAGE_KEY = "sourcify-current-server-url";
const CUSTOM_SERVER_URLS_STORAGE_KEY = "sourcify-custom-server-urls";
const SERVER_URL_CHANGED_EVENT = "serverUrlChanged";

export const getCurrentServerUrl = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURRENT_SERVER_URL_STORAGE_KEY);
};

export const setCurrentServerUrl = (url: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(CURRENT_SERVER_URL_STORAGE_KEY, url);
  window.dispatchEvent(new CustomEvent(SERVER_URL_CHANGED_EVENT));
};

export const removeCurrentServerUrl = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CURRENT_SERVER_URL_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(SERVER_URL_CHANGED_EVENT));
};

export const getCustomServerUrls = (): string[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(CUSTOM_SERVER_URLS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const setCustomServerUrls = (urls: string[]): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOM_SERVER_URLS_STORAGE_KEY, JSON.stringify(urls));
  window.dispatchEvent(new CustomEvent(SERVER_URL_CHANGED_EVENT));
};

export const useServerUrl = () => {
  const [currentServerUrl, setCurrentServerUrlState] = useState<string | null>(getCurrentServerUrl());
  const [customServerUrls, setCustomServerUrlsState] = useState<string[]>(getCustomServerUrls());

  useEffect(() => {
    const handleServerUrlChange = () => {
      setCurrentServerUrlState(getCurrentServerUrl());
      setCustomServerUrlsState(getCustomServerUrls());
    };
    
    window.addEventListener(SERVER_URL_CHANGED_EVENT, handleServerUrlChange);
    return () => window.removeEventListener(SERVER_URL_CHANGED_EVENT, handleServerUrlChange);
  }, []);

  return { currentServerUrl, customServerUrls };
};