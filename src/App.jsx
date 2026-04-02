import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Toast } from "./components/Toast";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AddSale from "./pages/AddSale";
import AddExpense from "./pages/AddExpense";
import ManageItems from "./pages/ManageItems";
import BatchTracker from "./pages/BatchTracker";
import SalesReport from "./pages/SalesReport";
import Settings from "./pages/Settings";

function AppShell() {
  const { session, profile } = useAuth();
  const location = useLocation();

  // Loading state while auth resolves
  if (session === undefined) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cream)" }}>
        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, color: "var(--ink-muted)" }} />
      </div>
    );
  }

  if (!session) return <Auth />;

  const NAV = [
    { to: "/", icon: "💰", label: "Sale" },
    { to: "/dashboard", icon: "📊", label: "Today" },
    { to: "/batch", icon: "🍞", label: "Batch" },
    { to: "/report", icon: "📑", label: "Report" },
    { to: "/catalogue", icon: "📦", label: "Items" },
    { to: "/settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="business-name">{profile?.business_name || "Phool Book"}</div>
          <div className="app-tagline">📒 Phool Book</div>
        </div>
        <div className="header-actions">
          <NavLink to="/expense" style={{ textDecoration: "none" }}>
            <button className="btn btn-ghost btn-sm">+ Expense</button>
          </NavLink>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: "auto" }}>
        <Routes>
          <Route path="/" element={<AddSale />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expense" element={<AddExpense />} />
          <Route path="/catalogue" element={<ManageItems />} />
          <Route path="/batch" element={<BatchTracker />} />
          <Route path="/report" element={<SalesReport />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>

      <nav className="bottom-nav">
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <span className="nav-icon">{icon}</span>
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </Router>
  );
}
