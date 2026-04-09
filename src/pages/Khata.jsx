import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { showToast } from "../components/Toast";

function fmt(dt) {
  return new Date(dt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function Khata() {
  const { session } = useAuth();
  const [credits, setCredits]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState("unpaid"); // unpaid | paid
  const [search, setSearch]     = useState("");
  const [totals, setTotals]     = useState({ unpaid: 0, paid: 0 });

  useEffect(() => { if (session) fetchCredits(); }, [session]);

  const fetchCredits = async () => {
    setLoading(true);
    const { data } = await supabase.from("ledgit_sales")
      .select("id, customer_name, customer_phone, final_total, created_at, credit_paid_at, note, is_credit")
      .eq("user_id", session.user.id)
      .eq("is_credit", true)
      .order("created_at", { ascending: false });
    const rows = data || [];
    setCredits(rows);
    setTotals({
      unpaid: rows.filter(r => !r.credit_paid_at).reduce((s, r) => s + Number(r.final_total), 0),
      paid:   rows.filter(r =>  r.credit_paid_at).reduce((s, r) => s + Number(r.final_total), 0),
    });
    setLoading(false);
  };

  const markPaid = async (id) => {
    const confirmed = window.confirm("Mark this as paid?");
    if (!confirmed) return;
    const { error } = await supabase.from("ledgit_sales")
      .update({ credit_paid_at: new Date().toISOString(), payment_mode: "cash" })
      .eq("id", id).eq("user_id", session.user.id);
    if (error) { showToast("❌ " + error.message); return; }
    showToast("✅ Marked as paid!");
    fetchCredits();
  };

  const sendWhatsApp = (row) => {
    const msg = `Hi ${row.customer_name}, you have a pending payment of ₹${Number(row.final_total).toLocaleString()} from ${fmt(row.created_at)}. Please clear when convenient. Thank you! 🙏`;

    // Strip everything except digits
    let phone = (row.customer_phone || "").replace(/\D/g, "");

    // If number is 10 digits (Indian mobile), prepend country code 91
    if (phone.length === 10) phone = "91" + phone;

    // If starts with 0, replace with 91
    if (phone.startsWith("0")) phone = "91" + phone.slice(1);

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const unpaid = credits.filter(c => !c.credit_paid_at);
  const paid   = credits.filter(c =>  c.credit_paid_at);
  const activeList = (tab === "unpaid" ? unpaid : paid)
    .filter(c => (c.customer_name || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page">
      <div className="page-title">
        Khata
        <span>Credit sales tracker</span>
      </div>

      {/* Summary */}
      <div className="card-row">
        <div className="stat-card accent-rose">
          <div className="stat-label">Outstanding</div>
          <div className="stat-value">₹{totals.unpaid.toLocaleString()}</div>
        </div>
        <div className="stat-card accent-green">
          <div className="stat-label">Recovered</div>
          <div className="stat-value">₹{totals.paid.toLocaleString()}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button className={`tab-btn ${tab === "unpaid" ? "active" : ""}`} onClick={() => setTab("unpaid")}>
          Unpaid {unpaid.length > 0 && `(${unpaid.length})`}
        </button>
        <button className={`tab-btn ${tab === "paid" ? "active" : ""}`} onClick={() => setTab("paid")}>
          Paid {paid.length > 0 && `(${paid.length})`}
        </button>
      </div>

      <input className="input" placeholder="🔍 Search by customer name…" value={search} onChange={e => setSearch(e.target.value)} />

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
          <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3, color: "var(--ink-muted)" }} />
        </div>
      ) : activeList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{tab === "unpaid" ? "🎉" : "📋"}</div>
          <p>{tab === "unpaid" ? "No outstanding credit — all clear!" : "No paid credit sales yet"}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {activeList.map(c => (
            <div key={c.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{c.customer_name}</div>
                  {c.customer_phone && (
                    <div style={{ fontSize: 13, color: "var(--ink-light)" }}>📞 {c.customer_phone}</div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
                    ₹{Number(c.final_total).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-light)" }}>
                    {fmt(c.created_at)}
                    {c.credit_paid_at && ` · paid ${fmt(c.credit_paid_at)}`}
                  </div>
                </div>
              </div>

              {c.note && (
                <div style={{ fontSize: 13, color: "var(--ink-muted)", fontStyle: "italic", borderLeft: "2px solid var(--border)", paddingLeft: 10 }}>
                  "{c.note}"
                </div>
              )}

              {!c.credit_paid_at && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-green btn-sm" style={{ flex: 1 }} onClick={() => markPaid(c.id)}>
                    ✅ Mark as Paid
                  </button>
                  {c.customer_phone && (
                    <button className="btn btn-whatsapp btn-sm" style={{ flex: 1 }} onClick={() => sendWhatsApp(c)}>
                      📲 Remind
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
