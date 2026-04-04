import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

function fmt(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", weekday: "short" });
}

export default function ClosingHistory() {
  const { session } = useAuth();
  const [closings, setClosings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [summary, setSummary]   = useState({ sales: 0, expenses: 0, profit: 0 });

  useEffect(() => { if (session) fetchClosings(); }, [session]);

  const fetchClosings = async () => {
    setLoading(true);
    const { data } = await supabase.from("hisaabi_closing").select("*")
      .eq("user_id", session.user.id).order("closing_date", { ascending: false });
    const rows = data || [];
    setClosings(rows);
    setSummary({
      sales:    rows.reduce((s, r) => s + Number(r.total_sales), 0),
      expenses: rows.reduce((s, r) => s + Number(r.total_expenses), 0),
      profit:   rows.reduce((s, r) => s + Number(r.total_profit), 0),
    });
    setLoading(false);
  };

  return (
    <div className="page">
      <div className="page-title">
        Closing History
        <span>Past day-end summaries</span>
      </div>

      {!loading && closings.length > 0 && (
        <>
          <div className="section-label">All-time Summary</div>
          <div className="card-row">
            <div className="stat-card accent-ink">
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">₹{summary.sales.toLocaleString()}</div>
            </div>
            <div className="stat-card accent-rose">
              <div className="stat-label">Total Expenses</div>
              <div className="stat-value">₹{summary.expenses.toLocaleString()}</div>
            </div>
          </div>
          <div className="stat-card" style={{
            background: summary.profit >= 0 ? "var(--green-light)" : "var(--rose-light)",
            borderColor: summary.profit >= 0 ? "#86EFAC" : "#FECDD3",
          }}>
            <div className="stat-label" style={{ color: summary.profit >= 0 ? "var(--green)" : "var(--rose)" }}>Net Profit</div>
            <div className="stat-value" style={{ fontSize: 28, color: summary.profit >= 0 ? "var(--green)" : "var(--rose)" }}>
              {summary.profit >= 0 ? "+" : ""}₹{summary.profit.toLocaleString()}
            </div>
          </div>
        </>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
          <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3, color: "var(--ink-muted)" }} />
        </div>
      ) : closings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔒</div>
          <p>No days closed yet. Use the Dashboard to close a day.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {closings.map(c => {
            const profit = Number(c.total_profit);
            return (
              <div key={c.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16 }}>{fmt(c.closing_date)}</span>
                  <span className={`badge ${profit >= 0 ? "badge-green" : "badge-rose"}`}>
                    {profit >= 0 ? "+" : ""}₹{profit.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1, background: "var(--surface)", borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ fontSize: 11, color: "var(--ink-light)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Sales</div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>₹{Number(c.total_sales).toLocaleString()}</div>
                  </div>
                  <div style={{ flex: 1, background: "var(--surface)", borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ fontSize: 11, color: "var(--ink-light)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Expenses</div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>₹{Number(c.total_expenses).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
