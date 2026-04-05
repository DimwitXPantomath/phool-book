import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
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
import ExpenseHistory from "./pages/ExpenseHistory";
import ClosingHistory from "./pages/ClosingHistory";
import Khata from "./pages/Khata";
import SalesSearch from "./pages/SalesSearch";

function AppShell() {
  const { session, profile } = useAuth();

  if (session === undefined) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cream)" }}>
        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, color: "var(--ink-muted)" }} />
      </div>
    );
  }

  if (!session) return <Auth />;

  const NAV = [
    { to: "/",         icon: "💰", label: "Sale"    },
    { to: "/dashboard",icon: "📊", label: "Today"   },
    { to: "/khata",    icon: "📋", label: "Khata"   },
    { to: "/sales",    icon: "🔍", label: "Sales"   },
    { to: "/report",   icon: "📑", label: "Report"  },
    { to: "/more",     icon: "⋯",  label: "More"    },
  ];

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="business-name">{profile?.business_name || "Ledgit"}</div>
          <div className="app-tagline">Your business, sorted.</div>
        </div>
        <div className="header-actions">
          <NavLink to="/expense" style={{ textDecoration: "none" }}>
            <button className="btn btn-ghost btn-sm">+ Expense</button>
          </NavLink>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: "auto" }}>
        <Routes>
          <Route path="/"              element={<AddSale />} />
          <Route path="/dashboard"     element={<Dashboard />} />
          <Route path="/expense"       element={<AddExpense />} />
          <Route path="/expenses"      element={<ExpenseHistory />} />
          <Route path="/catalogue"     element={<ManageItems />} />
          <Route path="/batch"         element={<BatchTracker />} />
          <Route path="/report"        element={<SalesReport />} />
          <Route path="/settings"      element={<Settings />} />
          <Route path="/closing"       element={<ClosingHistory />} />
          <Route path="/khata"         element={<Khata />} />
          <Route path="/sales"         element={<SalesSearch />} />
          <Route path="/more"          element={<MoreMenu />} />
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

function MoreMenu() {
  const links = [
    { to: "/batch",    icon: "🍞", label: "Batch Tracker",    sub: "Log baking batches by date" },
    { to: "/expenses", icon: "💸", label: "Expense History",  sub: "Browse & search all expenses" },
    { to: "/closing",  icon: "🔒", label: "Closing History",  sub: "View past day-end summaries" },
    { to: "/catalogue",icon: "📦", label: "Manage Items",     sub: "Add items & variants" },
    { to: "/settings", icon: "⚙️", label: "Settings",         sub: "Profile, tax, channels" },
  ];

  return (
    <div className="page">
      <div className="page-title">More</div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {links.map(({ to, icon, label, sub }) => (
          <NavLink key={to} to={to} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="list-row" style={{ padding: "14px 16px", cursor: "pointer" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1 }}>
                <span style={{ fontSize: 22 }}>{icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{label}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-light)" }}>{sub}</div>
                </div>
              </div>
              <span style={{ color: "var(--ink-light)", fontSize: 18 }}>›</span>
            </div>
          </NavLink>
        ))}
      </div>
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
