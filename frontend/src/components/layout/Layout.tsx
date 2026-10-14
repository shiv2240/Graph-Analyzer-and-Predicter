import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Search,
  TrendingUp,
  Brain,
  Filter,
  Briefcase,
  FlaskConical,
  BarChart3,
  Settings,
  ChevronLeft,
  Zap,
  Menu,
  X,
} from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/stocks/RELIANCE.NS", icon: TrendingUp, label: "Pro Trader & AI" },
  { to: "/explorer", icon: Search, label: "Stock Explorer" },
  { to: "/ai-research", icon: Brain, label: "AI Research" },
  { to: "/screener", icon: Filter, label: "Screener" },
  { to: "/portfolio", icon: Briefcase, label: "Portfolio" },
  { to: "/backtest", icon: FlaskConical, label: "Backtesting" },
  { to: "/models", icon: BarChart3, label: "Model Eval" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const activePage = NAV_ITEMS.find((item) =>
    location.pathname.startsWith(item.to)
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "flex flex-col shrink-0 bg-[#0B0E13] border-r border-[#1B222C]",
          "transition-all duration-300 ease-in-out z-30",
          "fixed top-0 left-0 h-full lg:relative",
          collapsed ? "w-16" : "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div
          className={clsx(
            "flex items-center gap-3 px-4 h-16 border-b border-[#1B222C] shrink-0",
            collapsed && "justify-center px-0"
          )}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#D4F938] text-black shadow-[0_0_20px_rgba(212,249,56,0.35)] shrink-0 font-black">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-black">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-extrabold text-white tracking-tight leading-none truncate">
                GraphIntel
              </span>
              <span className="text-[10px] text-[#D4F938] font-mono leading-none mt-1">
                AI PREDICTOR
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold",
                  "transition-all duration-150 cursor-pointer group",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-[#D4F938]/15 text-[#D4F938] font-bold border border-[#D4F938]/30 shadow-[0_0_15px_rgba(212,249,56,0.15)]"
                    : "text-text-secondary hover:bg-white/5 hover:text-white"
                )
              }
              title={collapsed ? label : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <Icon
                size={18}
                className="shrink-0"
              />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="px-2 pb-3 shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={clsx(
              "hidden lg:flex items-center gap-3 px-3 py-2 rounded-xl w-full",
              "text-text-muted hover:text-white hover:bg-white/5",
              "transition-all duration-150 text-xs font-mono",
              collapsed && "justify-center px-0"
            )}
          >
            <ChevronLeft
              size={16}
              className={clsx("transition-transform duration-300", collapsed && "rotate-180")}
            />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-[#0A0D10]">
        {/* Top bar (only displayed when not on dashboard, dashboard has its own full top nav) */}
        {location.pathname !== "/dashboard" && location.pathname !== "/" && (
          <header className="flex items-center gap-4 h-14 px-4 md:px-6 border-b border-[#1B222C] bg-[#0E1217] shrink-0">
            {/* Mobile menu button */}
            <button
              className="lg:hidden text-text-secondary hover:text-text-primary"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-text-muted hidden sm:block">GraphIntel AI</span>
              <span className="text-text-muted hidden sm:block">/</span>
              <span className="text-[#D4F938] font-bold">
                {activePage?.label ?? "Dashboard"}
              </span>
            </div>

            <div className="flex-1" />

            {/* Status indicator */}
            <div className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
              <span className="h-2 w-2 rounded-full bg-[#D4F938] animate-ping" />
              <span className="hidden sm:block text-[#D4F938]">Live Terminal</span>
            </div>
          </header>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
