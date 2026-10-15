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
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    <div className="flex h-screen overflow-hidden bg-black text-text-primary selection:bg-[#D4F938]/30 selection:text-white">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Pure Obsidian Glass */}
      <aside
        className={clsx(
          "flex flex-col shrink-0 bg-black/90 backdrop-blur-2xl border-r border-white/[0.08]",
          "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-50",
          "fixed top-0 left-0 h-full lg:relative",
          collapsed ? "w-16" : "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div
          className={clsx(
            "flex items-center gap-3 px-4 h-16 border-b border-white/[0.08] shrink-0",
            collapsed && "justify-center px-0"
          )}
        >
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4F938] to-[#99cf13] text-black shadow-[0_0_25px_rgba(212,249,56,0.4)] shrink-0 font-black cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-black">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </motion.div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-white tracking-tight leading-none truncate">
                  GraphIntel
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#D4F938] animate-pulse" />
              </div>
              <span className="text-[9.5px] text-[#D4F938] font-mono font-bold leading-none mt-1 tracking-wider uppercase">
                AI PREDICTOR PRO
              </span>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-3 px-2 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                className={clsx(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold",
                  "transition-all duration-200 cursor-pointer group",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "text-[#D4F938] font-bold"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                )}
                title={collapsed ? label : undefined}
                onClick={() => setMobileOpen(false)}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavGlow"
                    className="absolute inset-0 bg-white/[0.04] border border-[#D4F938]/30 rounded-xl shadow-[0_0_20px_rgba(212,249,56,0.12)] -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon
                  size={18}
                  className={clsx(
                    "shrink-0 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-[#D4F938] drop-shadow-[0_0_8px_rgba(212,249,56,0.5)]" : "text-zinc-400 group-hover:text-white"
                  )}
                />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="px-2 pb-3 shrink-0 border-t border-white/[0.06] pt-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={clsx(
              "hidden lg:flex items-center gap-3 px-3 py-2 rounded-xl w-full",
              "text-zinc-500 hover:text-white hover:bg-white/[0.05]",
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

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-black">
        {/* Top bar (only displayed when not on dashboard) */}
        {location.pathname !== "/dashboard" && location.pathname !== "/" && (
          <header className="flex items-center gap-4 h-14 px-4 md:px-6 border-b border-white/[0.08] bg-black/70 backdrop-blur-2xl shrink-0 z-30">
            {/* Mobile menu button */}
            <button
              className="lg:hidden text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05]"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-zinc-500 hidden sm:block">GraphIntel AI</span>
              <span className="text-zinc-600 hidden sm:block">/</span>
              <span className="text-[#D4F938] font-bold flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                {activePage?.label ?? "Terminal"}
              </span>
            </div>

            <div className="flex-1" />

            {/* Status indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-[11px] font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4F938] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4F938]" />
              </span>
              <span className="hidden sm:block text-zinc-300 font-semibold">Live Obsidian Terminal</span>
            </div>
          </header>
        )}

        {/* Page content with smooth framer-motion transitions */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="p-4 md:p-6 min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
