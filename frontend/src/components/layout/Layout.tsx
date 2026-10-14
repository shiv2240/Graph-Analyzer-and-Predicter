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
          "flex flex-col shrink-0 bg-surface-1 border-r border-border",
          "transition-all duration-300 ease-in-out z-30",
          "fixed top-0 left-0 h-full lg:relative",
          collapsed ? "w-16" : "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div
          className={clsx(
            "flex items-center gap-3 px-4 h-14 border-b border-border shrink-0",
            collapsed && "justify-center px-0"
          )}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple shrink-0">
            <TrendingUp size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-text-primary leading-none truncate">
                StockIntel
              </span>
              <span className="text-2xs text-text-muted leading-none mt-0.5">
                AI Research
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium",
                  "transition-all duration-150 cursor-pointer group",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-accent-blue-subtle text-accent-blue"
                    : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
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
              "hidden lg:flex items-center gap-3 px-3 py-2 rounded-md w-full",
              "text-text-muted hover:text-text-secondary hover:bg-surface-2",
              "transition-all duration-150 text-sm",
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
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 h-14 px-4 md:px-6 border-b border-border bg-surface-1 shrink-0">
          {/* Mobile menu button */}
          <button
            className="lg:hidden text-text-secondary hover:text-text-primary"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-muted hidden sm:block">StockIntel AI</span>
            <span className="text-text-muted hidden sm:block">/</span>
            <span className="text-text-primary font-medium">
              {activePage?.label ?? "Dashboard"}
            </span>
          </div>

          <div className="flex-1" />

          {/* Status indicator */}
          <div className="flex items-center gap-2 text-2xs text-text-muted">
            <Zap size={12} className="text-accent-blue" />
            <span className="hidden sm:block">Research Only</span>
          </div>

          {/* Disclaimer */}
          <div className="hidden md:flex items-center">
            <span className="text-2xs px-2 py-1 rounded-full bg-yellow-400/10 text-yellow-400/80 border border-yellow-400/20">
              Educational Use Only
            </span>
          </div>
        </header>

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
