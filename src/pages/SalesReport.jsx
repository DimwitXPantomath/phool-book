import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie
} from "recharts";

import { Cell } from "recharts";

export default function SalesReport() {

  const [tab,setTab] = useState("summary");
  const [data,setData] = useState([]);

  useEffect(()=>{
    fetchReport();
  },[]);

  const fetchReport = async ()=>{

    const { data } = await supabase
      .from("phoolbook_sale_items")
      .select(`
        qty,
        total,
        phoolbook_variants(variant_name),
        phoolbook_sales(payment_mode,created_at)
      `);

    setData(data || []);
  };

  const totalSales =
    data.reduce((sum,r)=>sum + Number(r.total),0);

  const cash =
    data.filter(r=>r.phoolbook_sales.payment_mode==="cash")
    .reduce((s,r)=>s+r.total,0);

  const upi =
    data.filter(r=>r.phoolbook_sales.payment_mode==="upi")
    .reduce((s,r)=>s+r.total,0);

  const orders = new Set(
    data.map(r=>r.phoolbook_sales.created_at)
  ).size;

  const itemSummary = {};

  data.forEach(r=>{
    const name = r.phoolbook_variants.variant_name;

    if(!itemSummary[name]){
      itemSummary[name] = {qty:0,total:0};
    }

    itemSummary[name].qty += r.qty;
    itemSummary[name].total += r.total;
  });

  const salesPerDay = {};

    data.forEach(r=>{
    const date = new Date(r.phoolbook_sales.created_at)
        .toLocaleDateString();

    if(!salesPerDay[date]) salesPerDay[date] = 0;

    salesPerDay[date] += r.total;
    });

    const salesPerDayData = Object.keys(salesPerDay).map(d=>({
    date:d,
    sales:salesPerDay[d]
    }));

    const flowerMap = {};

    data.forEach(r=>{
    const name = r.phoolbook_variants.variant_name;

    if(!flowerMap[name]){
        flowerMap[name] = 0;
    }

    flowerMap[name] += r.qty;
    });

    const flowerData = Object.keys(flowerMap).map(name=>({
    name,
    qty:flowerMap[name]
    }));

    const paymentData = [
    {name:"Cash", value:cash},
    {name:"UPI", value:upi}
    ];

  return (

    <div style={container}>

      <h2>📑 Sales Report</h2>

      {/* Tabs */}

      <div style={tabs}>

        <button style={tabBtn(tab==="summary")} onClick={()=>setTab("summary")}>
          Summary
        </button>

        <button style={tabBtn(tab==="items")} onClick={()=>setTab("items")}>
          Items
        </button>

        <button style={tabBtn(tab==="payment")} onClick={()=>setTab("payment")}>
          Payment
        </button>

        <button style={tabBtn(tab==="tx")} onClick={()=>setTab("tx")}>
          Transactions
        </button>

      </div>

      {/* SUMMARY */}

      {tab==="summary" && (
        <>

        <div style={grid}>
            <div style={card}>Sales ₹{totalSales}</div>
            <div style={card}>Orders {orders}</div>
            <div style={card}>Cash ₹{cash}</div>
            <div style={card}>UPI ₹{upi}</div>
        </div>

        <h3 style={{marginTop:"20px"}}>📈 Sales Per Day</h3>

        <div style={{width:"100%",height:250}}>

            <ResponsiveContainer>

            <LineChart data={salesPerDayData}>

                <XAxis dataKey="date" />

                <YAxis />

                <Tooltip />

                <Line
                type="monotone"
                dataKey="sales"
                stroke="#000"
                />

            </LineChart>

            </ResponsiveContainer>

        </div>

        </>
        )}

      {/* ITEMS */}

      {tab==="items" && (
        <>

        <h3>🌸 Top Selling Flowers</h3>

        <div style={{width:"100%",height:250}}>

            <ResponsiveContainer>

            <BarChart data={flowerData}>

                <XAxis dataKey="name" />

                <YAxis />

                <Tooltip />

                <Bar dataKey="qty" fill="#8884d8" />

            </BarChart>

            </ResponsiveContainer>

        </div>

        <h3 style={{marginTop:"20px"}}>Item Details</h3>

        <div>

            {Object.keys(itemSummary).map(name=>(
            <div key={name} style={row}>
                <div>{name}</div>
                <div>{itemSummary[name].qty} pcs</div>
                <div>₹{itemSummary[name].total}</div>
            </div>
            ))}

        </div>

        </>
        )}

      {/* PAYMENT */}

      {tab==="payment" && (
        <>

        <h3>💵 Payment Split</h3>

        <div style={{width:"100%",height:250}}>

            <ResponsiveContainer>

            <PieChart>

                <Pie
                data={paymentData}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
                label
                >

                {paymentData.map((entry,index)=>(
                    <Cell
                    key={index}
                    fill={index===0 ? "#00C49F" : "#0088FE"}
                    />
                ))}

                </Pie>

                <Tooltip />

            </PieChart>

            </ResponsiveContainer>

        </div>

        <h3 style={{marginTop:"20px"}}>Payment Details</h3>

        <div>

            <div style={row}>
            <div>Cash</div>
            <div>₹{cash}</div>
            </div>

            <div style={row}>
            <div>UPI</div>
            <div>₹{upi}</div>
            </div>

        </div>

        </>
        )}

      {/* TRANSACTIONS */}

      {tab==="tx" && (

        <div>

          {data.map((r,i)=>(
            <div key={i} style={row}>

              <div>
                {r.phoolbook_variants.variant_name}
                x{r.qty}
              </div>

              <div>₹{r.total}</div>

              <div>{r.phoolbook_sales.payment_mode}</div>

            </div>
          ))}

        </div>

      )}

    </div>

  );
}

/* styles */

const container={
  display:"flex",
  flexDirection:"column",
  gap:"15px"
};

const tabs={
  display:"flex",
  gap:"6px"
};

const tabBtn=(active)=>({
  flex:1,
  padding:"10px",
  border:"none",
  borderRadius:"8px",
  background: active ? "#000":"#eee",
  color: active ? "#fff":"#000"
});

const grid={
  display:"grid",
  gridTemplateColumns:"1fr 1fr",
  gap:"10px"
};

const card={
  padding:"12px",
  borderRadius:"10px",
  background:"#f5f5f5",
  fontWeight:"bold"
};

const row={
  display:"flex",
  justifyContent:"space-between",
  padding:"10px",
  borderBottom:"1px solid #eee"
};