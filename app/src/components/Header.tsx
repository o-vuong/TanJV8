import { Link, useNavigate } from "@tanstack/react-router";
import {
  Calculator,
  FileText,
  Home,
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  FolderOpen,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSession, signOut } from "../lib/auth/client";
import { Button } from "./ui/button";

// Inner component that uses the session hook (only rendered on client)
function HeaderWithSession({
  children,
}: {
  children: (session: { user?: { name?: string; email?: string } } | null) => React.ReactNode;
}) {
  const { data: session } = useSession();
  return <>{children(session)}</>;
}

// Client-only wrapper component for session-dependent UI
function ClientHeaderAuth({
  children,
}: {
  children: (session: { user?: { name?: string; email?: string } } | null) => React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return unauthenticated state during SSR
    return <>{children(null)}</>;
  }

  // Only render the component that uses the hook on the client
  return <HeaderWithSession>{children}</HeaderWithSession>;
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <ClientHeaderAuth>
      {(session) => (
        <>
          <header className="p-4 flex items-center justify-between bg-slate-900 text-white shadow-lg border-b border-slate-800">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors md:hidden"
                aria-label="Open menu"
              >
                <Menu size={24} />
              </button>
              <Link to="/" className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold leading-tight">
                    Manual J Calculator
                  </span>
                  <span className="text-xs text-gray-400">v8 Edition</span>
                </div>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-2">
              <Link
                to="/"
                className="px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                activeProps={{
                  className:
                    "px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors",
                }}
              >
                <span className="font-medium">Home</span>
              </Link>
              <Link
                to="/calculator"
                className="px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                activeProps={{
                  className:
                    "px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors",
                }}
              >
                <span className="font-medium">Calculator</span>
              </Link>
              {session?.user && (
                <Link
                  to="/projects"
                  className="px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                  activeProps={{
                    className:
                      "px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors",
                  }}
                >
                  <span className="font-medium">My Projects</span>
                </Link>
              )}
            </nav>
            <div className="hidden md:flex items-center gap-2">
              {session?.user ? (
                <>
                  <span className="text-sm text-gray-400 px-2">
                    {session.user.name || session.user.email}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-gray-300 hover:text-white hover:bg-slate-800"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/auth/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-300 hover:text-white hover:bg-slate-800"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth/register">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </header>

          <aside
            className={`fixed top-0 left-0 h-full w-80 bg-slate-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
              isOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold leading-tight">Manual J</h2>
                  <p className="text-xs text-gray-400">Navigation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex-1 p-4 overflow-y-auto">
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors mb-2"
                activeProps={{
                  className:
                    "flex items-center gap-3 p-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors mb-2",
                }}
              >
                <Home size={20} />
                <span className="font-medium">Home</span>
              </Link>

              <Link
                to="/calculator"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors mb-2"
                activeProps={{
                  className:
                    "flex items-center gap-3 p-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors mb-2",
                }}
              >
                <Calculator size={20} />
                <span className="font-medium">Calculator</span>
              </Link>

              {session?.user && (
                <Link
                  to="/projects"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors mb-2"
                  activeProps={{
                    className:
                      "flex items-center gap-3 p-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors mb-2",
                  }}
                >
                  <FolderOpen size={20} />
                  <span className="font-medium">My Projects</span>
                </Link>
              )}

              <div className="mt-8 pt-4 border-t border-slate-800">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 px-3">
                  Resources
                </p>
                <a
                  href="https://www.acca.org/standards/technical-manuals/manual-j"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors mb-2"
                >
                  <FileText size={20} />
                  <span className="font-medium">ACCA Manual J</span>
                </a>
              </div>
            </nav>

            <div className="p-4 border-t border-slate-800">
              {session?.user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <User size={16} />
                    <span>{session.user.name || session.user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-slate-800 text-sm text-gray-400 transition-colors"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/auth/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-slate-800 text-sm text-gray-300 transition-colors"
                  >
                    <LogIn size={16} />
                    Sign In
                  </Link>
                  <Link
                    to="/auth/register"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-slate-800 text-sm text-gray-300 transition-colors"
                  >
                    <User size={16} />
                    Sign Up
                  </Link>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-4">
                Manual J HVAC Load Calculator
                <br />
                v8 Edition
              </p>
            </div>
          </aside>
        </>
      )}
    </ClientHeaderAuth>
  );
}
