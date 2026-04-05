import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

const CHANNEL_META = {
  direct: { label: "Direct", emoji: "🏪" },
  zomato: { label: "Zomato", emoji: "🔴" },
  swiggy: { label: "Swiggy", emoji: "🟠" },
  online: { label: "Online", emoji: "🌐" },
};

function fmt(dt) {
  return new Date(dt).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function SalesSearch() {
  const { session } = useAuth();
  const [sales, setSales]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [channel, setChannel]   = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { if (session) fetchSales(); }, [session]);

  const fetchSales = async () => {
    setLoading(true);
    let q = supabase.from("ledgit_sales")
      .select(`*, ledgit_sale_items(qty, price, total, ledgit_variants(variant_name))`)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (dateFrom) q = q.gte("created_at", dateFrom);
    if (dateTo)   q = q.lte("created_at", dateTo + "T23:59:59");
    if (channel)  q = q.eq("channel", channel);
    const { data } = await q;
    setSales(data || []);
    setLoading(false);
  };

  const filtered = sales.filter(s => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (s.customer_name || "").toLowerCase().includes(q) ||
      (s.note || "").toLowerCase().includes(q) ||
      s.ledgit_sale_items?.some(i => (i.ledgit_variants?.variant_name || "").toLowerCase().includes(q))
    );
  });

  const totalRevenue = filtered.reduce((s, r) => s + Number(r.final_total), 0);

  return (
    <div className="page">
      <div className="page-title">
        Sales
        <span>Search & browse transactions</span>
      </div>

      {/* Filters */}
      <input className="input" placeholder="🔍 Search item, customer, note…" value={search} onChange={e => setSearch(e.target.value)} />

      <div style={{ display: "flex", gap: 8 }}>
        <div className="input-group" style={{ flex: 1 }}>
          <label className="input-label">From</label>
          <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="input-group" style={{ flex: 1 }}>
          <label className="input-label">To</label>
          <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["", "direct", "zomato", "swiggy", "online"].map(ch => (
          <button key={ch} onClick={() => { setChannel(ch); }} style={{
            padding: "7px 12px", borderRadius: "var(--radius-sm)", border: "1.5px solid",
            borderColor: channel === ch ? "var(--ink)" : "var(--border)",
            background: channel === ch ? "var(--ink)" : "var(--warm-white)",
            color: channel === ch ? "var(--cream)" : "var(--ink-muted)",
            fontSize: 12, fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer",
          }}>
            {ch === "" ? "All" : `${CHANNEL_META[ch]?.emoji} ${CHANNEL_META[ch]?.label}`}
          </button>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={fetchSales}>Apply</button>
      </div>

      {!loading && (
        <div className="card-row">
          <div className="stat-card accent-ink">
            <div className="stat-label">Showing</div>
            <div className="stat-value">{filtered.length} sales</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Revenue</div>
            <div className="stat-value">₹{totalRevenue.toLocaleString()}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
          <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3, color: "var(--ink-muted)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🛒</div><p>No sales found</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(s => {
            const isOpen = expanded === s.id;
            const ch = CHANNEL_META[s.channel] || CHANNEL_META.direct;
            return (
              <div key={s.id} className="card" style={{ cursor: "pointer" }} onClick={() => setExpanded(isOpen ? null : s.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "var(--ink-light)", marginBottom: 3 }}>
                      {fmt(s.created_at)}
                      {s.customer_name && ` · 👤 ${s.customer_name}`}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span className={`badge ${s.payment_mode === "cash" ? "badge-green" : s.payment_mode === "credit" ? "badge-rose" : "badge-blue"}`}>
                        {s.payment_mode === "cash" ? "💵 Cash" : s.payment_mode === "credit" ? "📋 Credit" : "📲 UPI"}
                      </span>
                      {s.channel && s.channel !== "direct" && (
                        <span className="badge badge-amber">{ch.emoji} {ch.label}</span>
                      )}
                      {s.is_credit && !s.credit_paid_at && (
                        <span className="badge badge-rose">Unpaid</span>
                      )}
                      {s.is_credit && s.credit_paid_at && (
                        <span className="badge badge-green">Paid</span>
                      )}
                    </div>
                    {s.note && (
                      <div style={{ fontSize: 12, color: "var(--ink-light)", marginTop: 4, fontStyle: "italic" }}>
                        "{s.note}"
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>
                      ₹{Number(s.final_total).toLocaleString()}
                    </div>
                    {Number(s.cart_total) !== Number(s.final_total) && (
                      <div style={{ fontSize: 11, color: "var(--rose)" }}>
                        was ₹{Number(s.cart_total).toLocaleString()}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "var(--ink-light)", marginTop: 2 }}>{isOpen ? "▲" : "▼"}</div>
                  </div>
                </div>

                {/* Expanded items */}
                {isOpen && s.ledgit_sale_items?.length > 0 && (
                  <div style={{ marginTop: 12, borderTop: "1px dashed var(--border)", paddingTop: 10 }}>
                    {s.ledgit_sale_items.map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                        <span>{item.ledgit_variants?.variant_name || "Item"} × {item.qty}</span>
                        <span style={{ fontWeight: 600 }}>₹{item.total}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-light)", marginTop: 6 }}>
                      <span>Bill #{s.id.slice(-6).toUpperCase()}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
