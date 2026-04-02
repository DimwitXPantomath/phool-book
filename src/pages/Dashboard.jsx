import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { showToast } from "../components/Toast";

export default function Dashboard() {
  const { session, profile } = useAuth();
  const [data, setData] = useState({ sales: 0, expenses: 0, cash: 0, upi: 0 });
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (session) fetchTodayData();
  }, [session]);

  // Sync offline sales on load
  useEffect(() => {
    if (navigator.onLine && session) syncOfflineSales();
  }, [session]);

  const syncOfflineSales = async () => {
    const offlineSales = JSON.parse(localStorage.getItem("offline_sales") || "[]");
    if (!offlineSales.length) return;

    for (const sale of offlineSales) {
      try {
        const { data: saleData } = await supabase
          .from("phoolbook_sales")
          .insert([{
            user_id: session.user.id,
            payment_mode: sale.paymentMode,
            cart_total: sale.cartTotal,
            final_total: sale.finalTotal,
          }])
          .select();

        if (saleData?.[0]) {
          const items = sale.cart.map(i => ({
            user_id: session.user.id,
            sale_id: saleData[0].id,
            variant_id: i.variant_id,
            qty: i.qty,
            price: i.price,
            total: i.total,
          }));
          await supabase.from("phoolbook_sale_items").insert(items);
        }
      } catch (e) { console.error(e); }
    }

    localStorage.removeItem("offline_sales");
    showToast("✅ Offline sales synced");
    fetchTodayData();
  };

  const fetchTodayData = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    const [{ data: salesData }, { data: expenseData }] = await Promise.all([
      supabase.from("phoolbook_sales").select("*")
        .eq("user_id", session.user.id).gte("created_at", today),
      supabase.from("phoolbook_expenses").select("*")
        .eq("user_id", session.user.id).gte("created_at", today),
    ]);

    let sales = 0, cash = 0, upi = 0;
    salesData?.forEach(s => {
      const amt = Number(s.final_total);
      sales += amt;
      if (s.payment_mode === "cash") cash += amt;
      if (s.payment_mode === "upi") upi += amt;
    });

    const expenses = expenseData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    setData({ sales, expenses, cash, upi });
    setLoading(false);
  };

  const profit = data.sales - data.expenses;

  const handleClosingDay = async () => {
    const today = new Date().toISOString().split("T")[0];
    const confirmed = window.confirm(
      `Close today's books?\n\nSales: ₹${data.sales}\nExpenses: ₹${data.expenses}\nProfit: ₹${profit}`
    );
    if (!confirmed) return;

    setClosing(true);
    const { error } = await supabase.from("phoolbook_closing").insert([{
      user_id: session.user.id,
      closing_date: today,
      total_sales: data.sales,
      total_expenses: data.expenses,
      total_profit: profit,
    }]);
    setClosing(false);
    if (error) showToast("❌ Error closing day");
    else showToast("✅ Day closed successfully");
  };

  const sendWhatsApp = () => {
    const name = profile?.business_name || "My Business";
    const msg = `📒 ${name} — Daily Report\n\nDate: ${new Date().toLocaleDateString("en-IN")}\n\n💰 Sales: ₹${data.sales}\n💸 Expenses: ₹${data.expenses}\n📈 Profit: ₹${profit}\n\n💵 Cash: ₹${data.cash}\n📲 UPI: ₹${data.upi}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading) return (
    <div className="page" style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
      <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3, color: "var(--ink-muted)" }} />
    </div>
  );

  return (
    <div className="page">
      <div className="page-title">
        Today's Summary
        <span>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span>
      </div>

      <div className="card-row">
        <div className="stat-card accent-ink">
          <div className="stat-label">Total Sales</div>
          <div className="stat-value">₹{data.sales.toLocaleString()}</div>
        </div>
        <div className="stat-card accent-rose">
          <div className="stat-label">Expenses</div>
          <div className="stat-value">₹{data.expenses.toLocaleString()}</div>
        </div>
      </div>

      <div className="stat-card" style={{ background: profit >= 0 ? "var(--green-light)" : "var(--rose-light)", borderColor: profit >= 0 ? "#86EFAC" : "#FECDD3" }}>
        <div className="stat-label" style={{ color: profit >= 0 ? "var(--green)" : "var(--rose)" }}>Net Profit</div>
        <div className="stat-value" style={{ fontSize: 28, color: profit >= 0 ? "var(--green)" : "var(--rose)" }}>
          {profit >= 0 ? "+" : ""}₹{profit.toLocaleString()}
        </div>
      </div>

      <hr className="divider" />

      <div className="section-label">Payment Breakdown</div>
      <div className="card-row">
        <div className="stat-card accent-green">
          <div className="stat-label">Cash</div>
          <div className="stat-value">₹{data.cash.toLocaleString()}</div>
        </div>
        <div className="stat-card accent-blue">
          <div className="stat-label">UPI</div>
          <div className="stat-value">₹{data.upi.toLocaleString()}</div>
        </div>
      </div>

      <button className="btn btn-whatsapp" onClick={sendWhatsApp}>
        📲 Share WhatsApp Report
      </button>

      <button className="btn btn-ghost" onClick={handleClosingDay} disabled={closing}>
        {closing ? <span className="spinner" /> : "🔒"} Close Today's Books
      </button>
    </div>
  );
}
