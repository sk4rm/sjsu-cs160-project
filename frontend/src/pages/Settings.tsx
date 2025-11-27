// src/pages/Settings.tsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { LogOut, Info } from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  async function handleSignOut() {
    try {
      await logout();
      navigate("/"); // or "/login" depending on your routes
    } catch (err) {
      console.error("Failed to sign out", err);
    }
  }

  function handleReportProblem() {
    // replace email with your real support email or route to a support page
    window.location.href =
      "mailto:support@example.com?subject=NatureShare%20Problem";
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
      {/* Page header */}
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your account preferences and settings.
        </p>
      </header>

      {/* Account */}
      <section className="rounded-3xl border border-neutral-200 bg-white px-6 py-5 shadow-sm">
        <h2 className="text-base font-semibold">Account</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your account settings.
        </p>

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-4 flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium hover:bg-neutral-100"
        >
          <div className="flex items-center gap-2">
            <LogOut size={16} />
            <span>Sign Out</span>
          </div>
        </button>
      </section>

      {/* Support */}
      <section className="rounded-3xl border border-neutral-200 bg-white px-6 py-5 shadow-sm">
        <h2 className="text-base font-semibold">Support</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Get help or report issues.
        </p>

        <button
          type="button"
          onClick={handleReportProblem}
          className="mt-4 flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium hover:bg-neutral-100"
        >
          <div className="flex items-center gap-2">
            <Info size={16} />
            <span>Report a Problem</span>
          </div>
        </button>
      </section>
    </div>
  );
}
