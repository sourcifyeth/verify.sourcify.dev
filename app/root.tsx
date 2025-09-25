import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, Link, useLocation } from "react-router";
import { FaGithub } from "react-icons/fa";
import { Tooltip } from "react-tooltip";

import type { Route } from "./+types/root";
import "./app.css";
import { ServerConfigProvider } from "./contexts/ServerConfigContext";
import { ChainsProvider } from "./contexts/ChainsContext";
import { CompilerVersionsProvider } from "./contexts/CompilerVersionsContext";

export const links: Route.LinksFunction = () => [];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isWidgetRoute = location.pathname === '/widget';

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {import.meta.env.VITE_UMAMI_WEBSITE_ID && (
          <script
            defer
            src="https://analytics.umami.is/script.js"
            data-website-id={import.meta.env.VITE_UMAMI_WEBSITE_ID}
          />
        )}
      </head>
      <body>
        <ServerConfigProvider>
          <ChainsProvider>
            <CompilerVersionsProvider>
              {!isWidgetRoute && (
                <header className="shadow-sm">
                  <div className="mx-auto py-3 md:py-4 flex items-center justify-between w-full max-w-[100rem] px-4 md:px-12 lg:px-12 xl:px-24">
                    <Link to="/" className="flex items-center">
                      <img
                        src="/sourcify.png"
                        alt="Sourcify Logo"
                        className="h-8 md:h-10 w-auto mr-2 md:mr-3"
                        width={32}
                        height={32}
                      />
                      <span className="text-gray-700 font-vt323 text-xl md:text-2xl">verify.sourcify.eth</span>
                    </Link>
                    <a
                      href="https://github.com/sourcifyeth/verify.sourcify.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-900 transition-colors p-2"
                      aria-label="View source code on GitHub"
                    >
                      <FaGithub className="w-6 h-6" />
                    </a>
                  </div>
                </header>
              )}
              <main>{children}</main>
            </CompilerVersionsProvider>
          </ChainsProvider>
        </ServerConfigProvider>
        <Tooltip
          id="global-tooltip"
          style={{ maxWidth: "300px", fontSize: "14px", zIndex: 1000 }}
          className="!bg-gray-900 !text-white !rounded-lg !shadow-lg"
        />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
