import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AddItem from "./pages/AddItem";
import AddVariant from "./pages/AddVariant";
import AddSale from "./pages/AddSale";
import AddExpense from "./pages/AddExpense";
import SalesReport from "./pages/SalesReport";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./pages/Auth";


const [session,setSession] = useState(null);

useEffect(()=>{

  supabase.auth.getSession().then(({data})=>{
    setSession(data.session);
  });

  supabase.auth.onAuthStateChange((_event,session)=>{
    setSession(session);
  });

},[]);

export default function App() {
  return (
    <Router>
      <div style={containerStyle}>

        <div style={headerBar}>
          <h1 style={businessName}>🌸 Nisha Florist</h1>

          <div style={{display:"flex",gap:"10px",alignItems:"center"}}>
            <span style={brandName}>Phool Book</span>

            <button
              onClick={()=>supabase.auth.signOut()}
              style={logoutBtn}
            >
              Logout
            </button>
          </div>
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
                  <Link style={secondaryButton} to="/report">
                    📑 Sales Report
                  </Link>
                </div>
              </>
            }
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-item" element={<AddItem />} />
          <Route path="/add-variant" element={<AddVariant />} />
          <Route path="/add-expense" element={<AddExpense />} />
          <Route path="/report" element={<SalesReport />} />
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

const logoutBtn = {
  padding: "6px 10px",
  borderRadius: "6px",
  border: "none",
  background: "#000",
  color: "#fff",
  fontSize: "12px"
};