import { useRef } from "react";

export default function Bill({ sale, profile, onClose }) {
  const billRef = useRef(null);

  if (!sale) return null;

  const { cart, cartTotal, finalTotal, paymentMode, saleId, createdAt } = sale;
  const discount = cartTotal - finalTotal;

  const businessName = profile?.business_name || "My Business";
  const ownerName    = profile?.owner_name || "";
  const phone        = profile?.phone || "";
  const address      = profile?.address || "";
  const gstNumber    = profile?.gst_number || "";
  const taxEnabled   = profile?.tax_enabled || false;
  const taxLabel     = profile?.tax_label || "GST";
  const taxRate      = Number(profile?.tax_rate || 0);

  // Tax is calculated on the final (post-discount) amount
  const taxAmount    = taxEnabled && taxRate > 0 ? parseFloat(((finalTotal * taxRate) / 100).toFixed(2)) : 0;
  const grandTotal   = parseFloat((finalTotal + taxAmount).toFixed(2));

  const now = createdAt ? new Date(createdAt) : new Date();

  const handlePrint = () => {
    const billHtml = billRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=400,height=600");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width"/>
          <title>Bill — ${businessName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'DM Sans', sans-serif; font-size: 13px; color: #1A1208; background: white; }
            .bill { width: 100%; max-width: 320px; margin: 0 auto; padding: 20px 16px; }
            .header { text-align: center; margin-bottom: 14px; }
            .biz-name { font-size: 20px; font-weight: 700; }
            .biz-sub { font-size: 11px; color: #9C8E79; margin-top: 2px; }
            hr.dashed { border: none; border-top: 1px dashed #ccc; margin: 12px 0; }
            hr.solid  { border: none; border-top: 2px solid #1A1208; margin: 12px 0; }
            .meta { font-size: 11px; color: #5C4F3A; }
            .meta-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
            table { width: 100%; border-collapse: collapse; }
            thead th { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9C8E79; padding: 4px 0; text-align: left; }
            thead th.r { text-align: right; }
            tbody td { padding: 6px 0; font-size: 13px; vertical-align: top; }
            tbody td.r { text-align: right; font-weight: 600; }
            tbody td.c { text-align: center; color: #5C4F3A; }
            .trow { display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; }
            .trow.discount { color: #E11D48; }
            .trow.tax      { color: #D97706; }
            .trow.final    { font-size: 17px; font-weight: 700; padding-top: 8px; border-top: 2px solid #1A1208; margin-top: 6px; }
            .badge { display: inline-block; margin-top: 10px; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; }
            .footer { text-align: center; margin-top: 16px; font-size: 11px; color: #9C8E79; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="bill">${billHtml}</div>
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const rowStyle = (color) => ({
    display: "flex", justifyContent: "space-between",
    fontSize: 13, padding: "3px 0", color: color || "inherit",
  });

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(26,18,8,0.55)",
      zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center",
      animation: "fadeIn 0.2s ease",
    }}>
      <div style={{
        width: "100%", maxWidth: 430, background: "white",
        borderRadius: "20px 20px 0 0", maxHeight: "92dvh",
        display: "flex", flexDirection: "column",
        animation: "slideUp 0.25s cubic-bezier(0.4,0,0.2,1)",
      }}>

        {/* Sheet header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 20px 12px", borderBottom: "1px solid #E2D9C8",
        }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>🧾 Bill Preview</span>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#9C8E79" }}>✕</button>
        </div>

        {/* Scrollable bill content */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px" }}>
          <div ref={billRef} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#1A1208" }}>

            {/* Header */}
            <div className="header" style={{ textAlign: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{businessName}</div>
              {ownerName && <div style={{ fontSize: 11, color: "#9C8E79", marginTop: 2 }}>{ownerName}</div>}
              {phone && <div style={{ fontSize: 11, color: "#9C8E79" }}>📞 {phone}</div>}
              {address && <div style={{ fontSize: 11, color: "#9C8E79", marginTop: 2 }}>{address}</div>}
              {gstNumber && <div style={{ fontSize: 11, color: "#9C8E79", marginTop: 2, fontFamily: "monospace", letterSpacing: "0.05em" }}>GSTIN: {gstNumber}</div>}
            </div>

            <hr style={{ border: "none", borderTop: "2px solid #1A1208", margin: "12px 0" }} />

            {/* Bill meta */}
            <div style={{ fontSize: 11, color: "#5C4F3A", marginBottom: 12 }}>
              {[
                ["Date", now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })],
                ["Time", now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })],
                ...(saleId ? [["Bill No.", "#" + saleId.slice(-6).toUpperCase()]] : []),
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span>{k}</span><span style={{ fontFamily: k === "Bill No." ? "monospace" : "inherit" }}>{v}</span>
                </div>
              ))}
            </div>

            <hr style={{ border: "none", borderTop: "1px dashed #ccc", margin: "12px 0" }} />

            {/* Items */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9C8E79", padding: "4px 0", textAlign: "left" }}>Item</th>
                  <th style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9C8E79", padding: "4px 0", textAlign: "center" }}>Qty</th>
                  <th style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9C8E79", padding: "4px 0", textAlign: "right" }}>Rate</th>
                  <th style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9C8E79", padding: "4px 0", textAlign: "right" }}>Amt</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, i) => (
                  <tr key={i}>
                    <td style={{ padding: "6px 0", fontWeight: 500 }}>{item.name}</td>
                    <td style={{ padding: "6px 0", textAlign: "center", color: "#5C4F3A" }}>{item.qty}</td>
                    <td style={{ padding: "6px 0", textAlign: "right", color: "#5C4F3A" }}>₹{item.price}</td>
                    <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 600 }}>₹{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <hr style={{ border: "none", borderTop: "1px dashed #ccc", margin: "12px 0" }} />

            {/* Totals */}
            <div>
              <div style={rowStyle("#5C4F3A")}>
                <span>Subtotal</span><span>₹{cartTotal}</span>
              </div>

              {discount > 0 && (
                <div style={rowStyle("#E11D48")}>
                  <span>Discount</span><span>− ₹{discount}</span>
                </div>
              )}

              {discount > 0 && (
                <div style={rowStyle("#5C4F3A")}>
                  <span>After Discount</span><span>₹{finalTotal}</span>
                </div>
              )}

              {taxEnabled && taxAmount > 0 && (
                <div style={rowStyle("#D97706")}>
                  <span>{taxLabel} ({taxRate}%)</span><span>+ ₹{taxAmount}</span>
                </div>
              )}

              {/* Grand total line */}
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 17, fontWeight: 700,
                borderTop: "2px solid #1A1208", marginTop: 8, paddingTop: 8,
              }}>
                <span>Total</span>
                <span>₹{grandTotal}</span>
              </div>

              {taxEnabled && taxAmount > 0 && (
                <div style={{ fontSize: 10, color: "#9C8E79", marginTop: 4, textAlign: "right" }}>
                  Incl. {taxLabel} ₹{taxAmount} @ {taxRate}%
                </div>
              )}

              <div style={{ marginTop: 10 }}>
                <span style={{
                  display: "inline-block", padding: "4px 12px", borderRadius: 100,
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
                  background: paymentMode === "cash" ? "#DCFCE7" : "#DBEAFE",
                  color: paymentMode === "cash" ? "#15803D" : "#1D4ED8",
                }}>
                  {paymentMode === "cash" ? "💵 Cash" : "📲 UPI"}
                </span>
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px dashed #ccc", margin: "14px 0" }} />

            <div style={{ textAlign: "center", fontSize: 11, color: "#9C8E79" }}>
              <div>Thank you for your purchase! 🙏</div>
              <div style={{ marginTop: 4, fontSize: 10 }}>Powered by Ledgit</div>
            </div>

          </div>
        </div>

        {/* Action buttons */}
        <div style={{ padding: "14px 20px 24px", borderTop: "1px solid #E2D9C8", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 13, borderRadius: 10, border: "1.5px solid #E2D9C8",
            background: "white", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>
            Close
          </button>
          <button onClick={handlePrint} style={{
            flex: 2, padding: 13, borderRadius: 10, border: "none",
            background: "#1A1208", color: "white", fontSize: 15, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit", display: "flex",
            alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            🖨️ Print Bill
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 }           to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </div>
  );
}
