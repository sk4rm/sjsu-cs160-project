import { Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import About from "./pages/About";
import Settings from "./pages/Settings";
import Moderator from "./pages/Moderator"; // 🆕 new page
import {
  House,
  Trophy,
  Info,
  Leaf,
  User,
  Settings2,
  ShieldCheck, // 🆕 icon
} from "lucide-react";
import { useAuth } from "./Context/AuthContext"; // 🆕 auth hook

function SidebarLink({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode; // 🔁 was string
  label: string;
}) {
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
  const { user } = useAuth(); // 🆕 get current user

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto grid max-w-[120rem] grid-cols-1 md:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="sticky top-0 h-[100dvh] border-r border-neutral-200 bg-white p-4">
          <div className="mb-6 flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">Eco-Leveling</span>
          </div>

          {/* Main nav */}
          <nav className="flex flex-col gap-1">
            <SidebarLink
              to="/"
              icon={<House className="h-5 w-5" />}
              label="Home"
            />
            <SidebarLink
              to="/profile"
              icon={<User className="h-5 w-5" />}
              label="Profile"
            />
            <SidebarLink
              to="/leaderboard"
              icon={<Trophy className="h-5 w-5" />}
              label="Leaderboard"
            />
          </nav>

          <div className="my-6 h-px bg-neutral-200" />

          {/* Settings / About */}
          <nav className="flex flex-col gap-1">
            <SidebarLink
              to="/settings"
              icon={<Settings2 className="h-5 w-5" />}
              label="Settings"
            />
            <SidebarLink
              to="/about"
              icon={<Info className="h-5 w-5" />}
              label="About"
            />
          </nav>

          {/* 🛡 Moderator section – only if user is a moderator */}
          {user?.isModerator && (
            <>
              <div className="my-6 h-px bg-neutral-200" />
              <nav className="flex flex-col gap-1">
                <SidebarLink
                  to="/moderator"
                  icon={<ShieldCheck className="h-5 w-5" />}
                  label="Moderator"
                />
              </nav>
            </>
          )}
        </aside>

        {/* Main content */}
        <main className="px-4 pb-12 pt-6 md:px-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/about" element={<About />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/settings" element={<Settings />} />
            {/* 🆕 protected route (the page itself can also re-check isModerator) */}
            <Route path="/moderator" element={<Moderator />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
