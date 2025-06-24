import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, Link } from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { ChainsProvider } from "./contexts/ChainsContext";
import { CompilerVersionsProvider } from "./contexts/CompilerVersionsContext";

export const links: Route.LinksFunction = () => [];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ChainsProvider>
          <CompilerVersionsProvider>
            <header className="shadow-sm">
              <div className="mx-auto py-4 flex items-center w-full max-w-[100rem] px-6 md:px-12 lg:px-12 xl:px-24">
                <Link to="/verify" className="flex items-center">
                  <img src="/sourcify.png" alt="Sourcify Logo" className="h-10 w-auto mr-3" width={32} height={32} />
                  <span className="text-gray-700 font-vt323 text-2xl">sourcify.eth</span>
                </Link>
              </div>
            </header>
            <main>{children}</main>
          </CompilerVersionsProvider>
        </ChainsProvider>
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
