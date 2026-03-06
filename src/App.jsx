import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AddItem from "./pages/AddItem";
import AddVariant from "./pages/AddVariant";
import AddSale from "./pages/AddSale";
import AddExpense from "./pages/AddExpense";

export default function App() {
  return (
    <Router>
      <div style={containerStyle}>

        <div style={headerBar}>
          <h1 style={businessName}>🌸 Nisha Florist</h1>
          <span style={brandName}>Phool Book</span>
        </div>

        <Routes>
          <Route
            path="/"
            element={
              <>
                <AddSale />
                <div style={secondarySection}>
                  <Link style={secondaryButton} to="/add-expense">
                    ➕ Add Expense
                  </Link>
                  <Link style={secondaryButton} to="/dashboard">
                    📊 Dashboard
                  </Link>
                  <Link style={secondaryButton} to="/add-item">
                    📦 Manage Items
                  </Link>
                  <Link style={secondaryButton} to="/add-variant">
                    🌹 Manage Variants
                  </Link>
                </div>
              </>
            }
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-item" element={<AddItem />} />
          <Route path="/add-variant" element={<AddVariant />} />
          <Route path="/add-expense" element={<AddExpense />} />
        </Routes>

      </div>
    </Router>
  );
}

const containerStyle = {
  maxWidth: "420px",
  margin: "0 auto",
  padding: "15px",
  fontFamily: "sans-serif",
};

const titleStyle = {
  textAlign: "center",
  marginBottom: "15px",
};

const secondarySection = {
  marginTop: "25px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const secondaryButton = {
  padding: "12px",
  backgroundColor: "#f2f2f2",
  textDecoration: "none",
  textAlign: "center",
  borderRadius: "10px",
  fontWeight: "bold",
  color: "black",
};

const headerBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const businessName = {
  fontSize: "20px",
  fontWeight: "bold",
};

const brandName = {
  fontSize: "12px",
  color: "gray",
  fontWeight: "bold",
};