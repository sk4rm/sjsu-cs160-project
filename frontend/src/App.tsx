import { Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import About from "./pages/About";
import Settings from "./pages/Settings";

function SidebarLink({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
          isActive ? "bg-neutral-100 font-medium" : "hover:bg-neutral-50"
        }`
      }
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto grid max-w-[120rem] grid-cols-1 md:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="sticky top-0 h-[100dvh] border-r border-neutral-200 bg-white p-4">
          <div className="mb-6 flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white">
              🌿
            </div>
            <span className="text-lg font-semibold">Eco-Leveling</span>
          </div>

          <nav className="flex flex-col gap-1">
            <SidebarLink to="/" icon="🏠" label="Home" />
            <SidebarLink to="/leaderboard" icon="🏆" label="Leaderboard" />
            <SidebarLink to="/about" icon="ℹ️" label="About" />
          </nav>

          <div className="my-6 h-px bg-neutral-200" />

          <nav className="flex flex-col gap-1">
            <SidebarLink to="/profile" icon="👤" label="Profile" />
            <SidebarLink to="/settings" icon="⚙️" label="Settings" />
          </nav>
        </aside>

        {/* Main content */}
        <main className="px-4 pb-12 pt-6 md:px-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/about" element={<About />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
