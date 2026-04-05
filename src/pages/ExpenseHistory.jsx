import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { showToast } from "../components/Toast";

function fmt(dt) {
  return new Date(dt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ExpenseHistory() {
  const { session } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [total, setTotal]       = useState(0);

  useEffect(() => { if (session) fetchExpenses(); }, [session]);

  const fetchExpenses = async () => {
    setLoading(true);
    let q = supabase.from("ledgit_expenses").select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    if (dateFrom) q = q.gte("created_at", dateFrom);
    if (dateTo)   q = q.lte("created_at", dateTo + "T23:59:59");
    const { data } = await q;
    const results = data || [];
    setExpenses(results);
    setTotal(results.reduce((s, e) => s + Number(e.amount), 0));
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    await supabase.from("ledgit_expenses").delete().eq("id", id).eq("user_id", session.user.id);
    showToast("🗑️ Expense deleted");
    fetchExpenses();
  };

  const filtered = expenses.filter(e =>
    e.category.toLowerCase().includes(search.toLowerCase()) ||
    (e.note || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-title">
        Expense History
        <span>All recorded expenses</span>
      </div>

      {/* Search + date filters */}
      <input className="input" placeholder="🔍 Search by category or note…" value={search} onChange={e => setSearch(e.target.value)} />

      <div style={{ display: "flex", gap: 8 }}>
        <div className="input-group" style={{ flex: 1 }}>
          <label className="input-label">From</label>
          <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="input-group" style={{ flex: 1 }}>
          <label className="input-label">To</label>
          <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchExpenses}>Go</button>
        </div>
      </div>

      {/* Summary */}
      {!loading && (
        <div className="card-row">
          <div className="stat-card accent-rose">
            <div className="stat-label">Total Expenses</div>
            <div className="stat-value">₹{total.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Entries</div>
            <div className="stat-value">{filtered.length}</div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
          <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3, color: "var(--ink-muted)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">💸</div><p>No expenses found</p></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {filtered.map(e => (
            <div key={e.id} className="list-row" style={{ padding: "12px 16px", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{e.category}</div>
                <div style={{ fontSize: 12, color: "var(--ink-light)", marginTop: 2 }}>
                  {fmt(e.created_at)}
                  {e.note && ` · ${e.note}`}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>₹{Number(e.amount).toLocaleString()}</span>
                <span className={`badge ${e.payment_mode === "cash" ? "badge-green" : "badge-blue"}`}>
                  {e.payment_mode === "cash" ? "💵 Cash" : "📲 UPI"}
                </span>
              </div>
              <button onClick={() => handleDelete(e.id)} style={{
                border: "none", background: "transparent",
                color: "var(--ink-light)", cursor: "pointer", fontSize: 16, padding: 0,
              }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
