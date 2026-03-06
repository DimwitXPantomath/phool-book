import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AddExpense() {
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [loading, setLoading] = useState(false);

  const handleSaveExpense = async () => {
    if (!category || !amount) {
      alert("Fill all fields");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("phoolbook_expenses")
      .insert([
        {
          category,
          amount: Number(amount),
          payment_mode: paymentMode,
        },
      ]);

    setLoading(false);

    if (error) {
      alert("Error: " + error.message);
      console.log(error);
    } else {
      alert("Expense added successfully");
      setCategory("");
      setAmount("");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
      <h2>Add Expense</h2>

      <input
        style={inputStyle}
        type="text"
        placeholder="Flower Purchase / Transport / Rent"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />

      <input
        style={inputStyle}
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      {/* Toggle Buttons */}
      <div style={toggleContainer}>
        <button
          style={{
            ...toggleButton,
            backgroundColor: paymentMode === "cash" ? "#28a745" : "#e0e0e0",
            color: paymentMode === "cash" ? "white" : "black",
          }}
          onClick={() => setPaymentMode("cash")}
        >
          💵 Cash
        </button>

        <button
          style={{
            ...toggleButton,
            backgroundColor: paymentMode === "upi" ? "#007bff" : "#e0e0e0",
            color: paymentMode === "upi" ? "white" : "black",
          }}
          onClick={() => setPaymentMode("upi")}
        >
          📲 UPI
        </button>
      </div>

      <button style={buttonStyle} onClick={handleSaveExpense} disabled={loading}>
        {loading ? "Saving..." : "Save Expense"}
      </button>
    </div>
  );
}

/* Reuse styles */

const inputStyle = {
  padding: "12px",
  fontSize: "16px",
  borderRadius: "8px",
  border: "1px solid #ccc",
};

const toggleContainer = {
  display: "flex",
  gap: "10px",
};

const toggleButton = {
  flex: 1,
  padding: "14px",
  fontSize: "16px",
  borderRadius: "10px",
  border: "none",
  fontWeight: "bold",
};

const buttonStyle = {
  padding: "14px",
  fontSize: "16px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#dc3545",
  color: "white",
  fontWeight: "bold",
};