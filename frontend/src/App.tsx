import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import DashboardPage from "./pages/DashboardPage";
import StockExplorerPage from "./pages/StockExplorerPage";
import StockAnalysisPage from "./pages/StockAnalysisPage";
import AIResearchPage from "./pages/AIResearchPage";
import ScreenerPage from "./pages/ScreenerPage";
import PortfolioPage from "./pages/PortfolioPage";
import BacktestPage from "./pages/BacktestPage";
import ModelEvalPage from "./pages/ModelEvalPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="explorer" element={<StockExplorerPage />} />
          <Route path="stocks" element={<Navigate to="/stocks/RELIANCE.NS" replace />} />
          <Route path="stocks/:symbol" element={<StockAnalysisPage />} />
          <Route path="ai-research" element={<AIResearchPage />} />
          <Route path="screener" element={<ScreenerPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="backtest" element={<BacktestPage />} />
          <Route path="models" element={<ModelEvalPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
