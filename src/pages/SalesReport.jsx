import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";

export default function SalesReport() {
  const { session } = useAuth();
  const [tab, setTab] = useState("summary");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7");

  useEffect(() => { if (session) fetchReport(); }, [session, dateRange]);

  const fetchReport = async () => {
    setLoading(true);
    const from = new Date();
    from.setDate(from.getDate() - Number(dateRange));

    // Query sales directly — more reliable, includes credit sales
    const { data: salesData } = await supabase
      .from("ledgit_sales")
      .select(`id, payment_mode, final_total, created_at, ledgit_sale_items(qty, total, ledgit_variants(variant_name))`)
      .eq("user_id", session.user.id)
      .gte("created_at", from.toISOString())
      .order("created_at", { ascending: true });

    setData(salesData || []);
    setLoading(false);
  };

  // Flatten sale items for item-level stats
  const allItems = data.flatMap(s => (s.ledgit_sale_items || []).map(i => ({ ...i, sale: s })));

  const totalSales = data.reduce((sum, s) => sum + Number(s.final_total), 0);
  const cash  = data.filter(s => s.payment_mode === "cash").reduce((sum, s) => sum + Number(s.final_total), 0);
  const upi   = data.filter(s => s.payment_mode === "upi").reduce((sum, s) => sum + Number(s.final_total), 0);
  const credit = data.filter(s => s.payment_mode === "credit").reduce((sum, s) => sum + Number(s.final_total), 0);
  const totalQty = allItems.reduce((sum, i) => sum + i.qty, 0);

  const salesPerDay = {};
  data.forEach(s => {
    const date = new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    if (!salesPerDay[date]) salesPerDay[date] = 0;
    salesPerDay[date] += Number(s.final_total);
  });
  const salesPerDayData = Object.entries(salesPerDay).map(([date, sales]) => ({ date, sales }));

  const itemMap = {};
  allItems.forEach(i => {
    const name = i.ledgit_variants?.variant_name || "?";
    if (!itemMap[name]) itemMap[name] = { qty: 0, total: 0 };
    itemMap[name].qty += i.qty;
    itemMap[name].total += Number(i.total);
  });
  const itemData = Object.entries(itemMap).sort((a, b) => b[1].qty - a[1].qty).map(([name, v]) => ({ name, ...v }));

  const paymentData = [
    { name: "Cash", value: cash },
    { name: "UPI", value: upi },
    { name: "Credit", value: credit },
  ].filter(d => d.value > 0);

  if (loading) return (
    <div className="page" style={{ alignItems: "center", justifyContent: "center" }}>
      <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3, color: "var(--ink-muted)" }} />
    </div>
  );

  return (
    <div className="page">
      <div className="page-title">Sales Report</div>

      {/* Date range */}
      <div className="tab-bar">
        {[["7", "7 Days"], ["30", "30 Days"], ["90", "3 Months"]].map(([val, label]) => (
          <button key={val} className={`tab-btn ${dateRange === val ? "active" : ""}`} onClick={() => setDateRange(val)}>{label}</button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="card-row">
        <div className="stat-card accent-ink">
          <div className="stat-label">Revenue</div>
          <div className="stat-value">₹{totalSales.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Units Sold</div>
          <div className="stat-value">{totalQty}</div>
        </div>
      </div>
      <div className="card-row">
        <div className="stat-card accent-green">
          <div className="stat-label">Cash</div>
          <div className="stat-value">₹{cash.toLocaleString()}</div>
        </div>
        <div className="stat-card accent-blue">
          <div className="stat-label">UPI</div>
          <div className="stat-value">₹{upi.toLocaleString()}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button className={`tab-btn ${tab === "summary" ? "active" : ""}`} onClick={() => setTab("summary")}>Trend</button>
        <button className={`tab-btn ${tab === "items" ? "active" : ""}`} onClick={() => setTab("items")}>Items</button>
        <button className={`tab-btn ${tab === "payment" ? "active" : ""}`} onClick={() => setTab("payment")}>Payment</button>
      </div>

      {tab === "summary" && (
        <div className="card">
          <div className="section-label">Sales Per Day</div>
          {salesPerDayData.length === 0 ? (
            <div className="empty-state"><p>No sales in this period</p></div>
          ) : (
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={salesPerDayData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={50} />
                  <Tooltip formatter={v => `₹${v}`} />
                  <Line type="monotone" dataKey="sales" stroke="var(--amber)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--amber)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {tab === "items" && (
        <>
          {itemData.length > 0 && (
            <div className="card">
              <div className="section-label">Top Items (by qty)</div>
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer>
                  <BarChart data={itemData.slice(0, 8)}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="qty" fill="var(--amber)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {itemData.map(item => (
              <div key={item.name} className="list-row" style={{ padding: "12px 16px" }}>
                <span style={{ fontWeight: 500, flex: 1 }}>{item.name}</span>
                <span style={{ fontSize: 13, color: "var(--ink-muted)", marginRight: 8 }}>{item.qty} pcs</span>
                <span style={{ fontWeight: 700 }}>₹{item.total.toLocaleString()}</span>
              </div>
            ))}
            {itemData.length === 0 && <div className="empty-state"><p>No item data</p></div>}
          </div>
        </>
      )}

      {tab === "payment" && (
        <>
          {paymentData.length > 0 && (
            <div className="card" style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={paymentData} dataKey="value" nameKey="name" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {paymentData.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? "#15803D" : "#1D4ED8"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={v => `₹${v.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="list-row" style={{ padding: "14px 16px" }}>
              <span>💵 Cash</span>
              <span style={{ fontWeight: 700, color: "var(--green)" }}>₹{cash.toLocaleString()}</span>
            </div>
            <div className="list-row" style={{ padding: "14px 16px" }}>
              <span>📲 UPI</span>
              <span style={{ fontWeight: 700, color: "var(--blue)" }}>₹{upi.toLocaleString()}</span>
            </div>
            {credit > 0 && (
              <div className="list-row" style={{ padding: "14px 16px" }}>
                <span>📋 Credit (Khata)</span>
                <span style={{ fontWeight: 700, color: "var(--rose)" }}>₹{credit.toLocaleString()}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
