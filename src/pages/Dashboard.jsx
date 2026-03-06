import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const [salesTotal, setSalesTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [cashTotal, setCashTotal] = useState(0);
  const [upiTotal, setUpiTotal] = useState(0);
  const [closingLoading, setClosingLoading] = useState(false);

  useEffect(() => {
    fetchTodayData();
  }, []);

  const fetchTodayData = async () => {
    const today = new Date().toISOString().split("T")[0];

    // Fetch today's sales
    const { data: salesData } = await supabase
      .from("phoolbook_sales")
      .select("*")
      .gte("created_at", today);

    // Fetch today's expenses
    const { data: expenseData } = await supabase
      .from("phoolbook_expenses")
      .select("*")
      .gte("created_at", today);

    let totalSales = 0;
    let totalCash = 0;
    let totalUpi = 0;

    salesData?.forEach((sale) => {
      totalSales += Number(sale.total);

      if (sale.payment_mode === "cash") {
        totalCash += Number(sale.total);
      }

      if (sale.payment_mode === "upi") {
        totalUpi += Number(sale.total);
      }
    });

    let totalExpenses = 0;

    expenseData?.forEach((expense) => {
      totalExpenses += Number(expense.amount);
    });

    setSalesTotal(totalSales);
    setExpenseTotal(totalExpenses);
    setCashTotal(totalCash);
    setUpiTotal(totalUpi);
  };

  const profit = salesTotal - expenseTotal;

  const handleClosing = async () => {
    const today = new Date().toISOString().split("T")[0];
    const profit = salesTotal - expenseTotal;

    const confirmClose = window.confirm(
      `Close today?\n\nSales: ₹${salesTotal}\nExpenses: ₹${expenseTotal}\nProfit: ₹${profit}`
    );

    if (!confirmClose) return;

    setClosingLoading(true);

    const { error } = await supabase
      .from("phoolbook_closing")
      .insert([
        {
          closing_date: today,
          total_sales: salesTotal,
          total_expenses: expenseTotal,
          total_profit: profit,
        },
      ]);

    setClosingLoading(false);

    if (error) {
      alert("Error closing day: " + error.message);
    } else {
      alert("Day Closed Successfully ✅");
    }
  };

  return (
    <div style={container}>
      <h2>📊 Today Summary</h2>

      <div style={card}>💰 Sales: ₹{salesTotal}</div>
      <div style={card}>💸 Expenses: ₹{expenseTotal}</div>
      <div style={card}>📈 Profit: ₹{profit}</div>

      <div style={divider}></div>

      <div style={card}>💵 Cash Sales: ₹{cashTotal}</div>
      <div style={card}>📲 UPI Sales: ₹{upiTotal}</div>
    </div>
  );
}

const container = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const card = {
  padding: "12px",
  borderRadius: "10px",
  backgroundColor: "#f2f2f2",
  fontWeight: "bold",
};

const divider = {
  height: "1px",
  backgroundColor: "#ccc",
  margin: "10px 0",
};