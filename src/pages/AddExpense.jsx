import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { showToast } from "../components/Toast";

const CATEGORIES = ["Flower Purchase", "Raw Materials", "Transport", "Rent", "Utilities", "Packaging", "Salary", "Other"];

export default function AddExpense() {
  const { session } = useAuth();
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const finalCategory = category === "Other" ? customCategory : category;

  const handleSave = async () => {
    if (!finalCategory || !amount) { showToast("⚠️ Fill all fields"); return; }
    setLoading(true);

    const { error } = await supabase.from("phoolbook_expenses").insert([{
      user_id: session.user.id,
      category: finalCategory,
      amount: Number(amount),
      payment_mode: paymentMode,
      note,
    }]);

    setLoading(false);
    if (error) { showToast("❌ " + error.message); return; }

    showToast("✅ Expense saved!");
    setCategory("");
    setCustomCategory("");
    setAmount("");
    setNote("");
  };

  return (
    <div className="page">
      <div className="page-title">Add Expense</div>

      <div className="input-group">
        <label className="input-label">Category</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: "10px 8px",
                borderRadius: "var(--radius-sm)",
                border: "1.5px solid",
                borderColor: category === c ? "var(--ink)" : "var(--border)",
                background: category === c ? "var(--ink)" : "var(--warm-white)",
                color: category === c ? "var(--cream)" : "var(--ink)",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "var(--font-body)",
                cursor: "pointer",
                transition: "all var(--transition)",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {category === "Other" && (
        <div className="input-group">
          <label className="input-label">Custom Category</label>
          <input className="input" placeholder="Describe expense…" value={customCategory} onChange={e => setCustomCategory(e.target.value)} />
        </div>
      )}

      <div className="input-group">
        <label className="input-label">Amount (₹)</label>
        <input className="input" type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>

      <div className="input-group">
        <label className="input-label">Payment mode</label>
        <div className="toggle-group">
          <button className={`toggle-btn ${paymentMode === "cash" ? "active-cash" : ""}`} onClick={() => setPaymentMode("cash")}>💵 Cash</button>
          <button className={`toggle-btn ${paymentMode === "upi" ? "active-upi" : ""}`} onClick={() => setPaymentMode("upi")}>📲 UPI</button>
        </div>
      </div>

      <div className="input-group">
        <label className="input-label">Note (optional)</label>
        <input className="input" placeholder="e.g. Bought from Karol Bagh market" value={note} onChange={e => setNote(e.target.value)} />
      </div>

      <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
        {loading ? <span className="spinner" /> : "💾"} Save Expense
      </button>
    </div>
  );
}
