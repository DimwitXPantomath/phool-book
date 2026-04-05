import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { showToast } from "../components/Toast";
import Bill from "../components/Bill";

const CHANNEL_META = {
  direct: { label: "Direct", emoji: "🏪" },
  zomato: { label: "Zomato", emoji: "🔴" },
  swiggy: { label: "Swiggy", emoji: "🟠" },
  online: { label: "Online",  emoji: "🌐" },
};

export default function AddSale() {
  const { session, profile } = useAuth();
  const [isOnline, setIsOnline]           = useState(navigator.onLine);
  const [items, setItems]                 = useState([]);
  const [variants, setVariants]           = useState([]);
  const [selectedItem, setSelectedItem]   = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [qty, setQty]                     = useState(1);
  const [cart, setCart]                   = useState([]);
  const [paymentMode, setPaymentMode]     = useState("cash");
  const [channel, setChannel]             = useState("direct");
  const [finalPrice, setFinalPrice]       = useState("");
  const [isCredit, setIsCredit]           = useState(false);
  const [customerName, setCustomerName]   = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [saleNote, setSaleNote]           = useState("");
  const [saving, setSaving]               = useState(false);
  const [billData, setBillData]           = useState(null);

  // Channels available from profile settings
  const onlineEnabled    = profile?.online_channels_enabled || false;
  const enabledChannels  = profile?.enabled_channels || [];
  const availableChannels = [
    "direct",
    ...(onlineEnabled ? enabledChannels : []),
  ];

  useEffect(() => {
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);

  useEffect(() => { if (session) fetchItems(); }, [session]);

  const fetchItems = async () => {
    const { data } = await supabase.from("ledgit_items").select("*")
      .eq("user_id", session.user.id).order("name");
    setItems(data || []);
  };

  const fetchVariants = async (itemId) => {
    const { data } = await supabase.from("ledgit_variants").select("*")
      .eq("item_id", itemId).eq("user_id", session.user.id).order("variant_name");
    setVariants(data || []);
  };

  const handleItemChange = (id) => {
    setSelectedItem(id);
    setSelectedVariant(null);
    setVariants([]);
    if (id) fetchVariants(id);
  };

  const handleVariantChange = (variantId) => {
    setSelectedVariant(variants.find(v => v.id === variantId) || null);
  };

  const addToCart = () => {
    if (!selectedVariant) { showToast("⚠️ Select a variant first"); return; }
    const existing = cart.findIndex(c => c.variant_id === selectedVariant.id);
    if (existing >= 0) {
      const updated = [...cart];
      updated[existing].qty += qty;
      updated[existing].total = updated[existing].qty * updated[existing].price;
      setCart(updated);
    } else {
      setCart([...cart, {
        variant_id: selectedVariant.id,
        name: selectedVariant.variant_name,
        price: selectedVariant.base_price,
        qty,
        total: selectedVariant.base_price * qty,
      }]);
    }
    setQty(1);
    showToast("🛒 Added to cart");
  };

  const cartTotal  = cart.reduce((sum, i) => sum + i.total, 0);
  const finalTotal = finalPrice ? Number(finalPrice) : cartTotal;

  const updateQty = (index, delta) => {
    const updated = [...cart];
    updated[index].qty   = Math.max(1, updated[index].qty + delta);
    updated[index].total = updated[index].qty * updated[index].price;
    setCart(updated);
  };

  const removeItem = (index) => setCart(cart.filter((_, i) => i !== index));

  const resetForm = () => {
    setCart([]); setFinalPrice(""); setSelectedItem("");
    setSelectedVariant(null); setVariants([]);
    setIsCredit(false); setCustomerName(""); setCustomerPhone("");
    setSaleNote(""); setChannel("direct");
  };

  const handleSaveSale = async () => {
    if (!cart.length) { showToast("⚠️ Cart is empty"); return; }
    if (isCredit && !customerName.trim()) { showToast("⚠️ Enter customer name for credit sale"); return; }

    if (!isOnline) {
      const offlineSales = JSON.parse(localStorage.getItem("offline_sales") || "[]");
      offlineSales.push({ cart, cartTotal, finalTotal, paymentMode, channel, created_at: new Date() });
      localStorage.setItem("offline_sales", JSON.stringify(offlineSales));
      showToast("📴 Saved offline — will sync later");
      resetForm(); return;
    }

    setSaving(true);
    const { data: saleData, error } = await supabase.from("ledgit_sales").insert([{
      user_id:       session.user.id,
      payment_mode:  isCredit ? "credit" : paymentMode,
      channel,
      cart_total:    cartTotal,
      final_total:   finalTotal,
      is_credit:     isCredit,
      customer_name: customerName.trim() || null,
      customer_phone: customerPhone.trim() || null,
      note:          saleNote.trim() || null,
    }]).select();

    if (error) { showToast("❌ " + error.message); setSaving(false); return; }

    await supabase.from("ledgit_sale_items").insert(
      cart.map(item => ({
        user_id:    session.user.id,
        sale_id:    saleData[0].id,
        variant_id: item.variant_id,
        qty:        item.qty,
        price:      item.price,
        total:      item.total,
      }))
    );

    setSaving(false);
    setBillData({ cart: [...cart], cartTotal, finalTotal, paymentMode: isCredit ? "credit" : paymentMode, channel, saleId: saleData[0].id, createdAt: saleData[0].created_at });
    resetForm();
  };

  return (
    <div className="page">
      <div className="page-title">
        Record Sale
        {!isOnline && <span style={{ color: "var(--rose)", fontSize: 12 }}>📴 Offline</span>}
      </div>

      {/* Channel selector — only if online channels enabled and more than 1 available */}
      {availableChannels.length > 1 && (
        <div className="input-group">
          <label className="input-label">Sales Channel</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {availableChannels.map(ch => {
              const meta = CHANNEL_META[ch] || { label: ch, emoji: "📦" };
              return (
                <button key={ch} onClick={() => setChannel(ch)} style={{
                  padding: "8px 14px", borderRadius: "var(--radius-sm)", border: "1.5px solid",
                  borderColor: channel === ch ? "var(--ink)" : "var(--border)",
                  background: channel === ch ? "var(--ink)" : "var(--warm-white)",
                  color: channel === ch ? "var(--cream)" : "var(--ink-muted)",
                  fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer",
                  transition: "all var(--transition)",
                }}>
                  {meta.emoji} {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Item selector */}
      <div className="input-group">
        <label className="input-label">Item</label>
        <select className="input" value={selectedItem} onChange={e => handleItemChange(e.target.value)}>
          <option value="">Select item…</option>
          {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </div>

      {variants.length > 0 && (
        <div className="input-group">
          <label className="input-label">Variant</label>
          <select className="input" value={selectedVariant?.id || ""} onChange={e => handleVariantChange(e.target.value)}>
            <option value="">Select variant…</option>
            {variants.map(v => <option key={v.id} value={v.id}>{v.variant_name} — ₹{v.base_price}</option>)}
          </select>
        </div>
      )}

      {selectedVariant && (
        <div className="input-group">
          <label className="input-label">Quantity</label>
          <div className="qty-stepper">
            <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
            <div className="qty-value">{qty}</div>
            <button onClick={() => setQty(q => q + 1)}>+</button>
          </div>
        </div>
      )}

      <button className="btn btn-primary" onClick={addToCart} disabled={!selectedVariant}>
        + Add to Cart
      </button>

      {/* Cart */}
      {cart.length > 0 && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div className="section-label">Cart</div>

          {cart.map((item, i) => (
            <div key={i} className="cart-item">
              <div className="cart-item-name">{item.name}</div>
              <div className="mini-stepper">
                <button onClick={() => updateQty(i, -1)}>−</button>
                <span className="qty">{item.qty}</span>
                <button onClick={() => updateQty(i, 1)}>+</button>
              </div>
              <div className="cart-item-price">₹{item.total}</div>
              <button className="btn-icon" style={{ width: 28, height: 28, fontSize: 13 }} onClick={() => removeItem(i)}>✕</button>
            </div>
          ))}

          <hr className="divider" style={{ margin: "10px 0" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontWeight: 600, color: "var(--ink-muted)" }}>Cart Total</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600 }}>₹{cartTotal}</span>
          </div>

          <div className="input-group">
            <label className="input-label">Final price (after bargain)</label>
            <input className="input" type="number" placeholder={`₹${cartTotal}`} value={finalPrice} onChange={e => setFinalPrice(e.target.value)} />
          </div>

          {finalPrice && Number(finalPrice) !== cartTotal && (
            <div style={{ textAlign: "right", color: "var(--rose)", fontSize: 13, fontWeight: 600 }}>
              Discount: ₹{cartTotal - Number(finalPrice)}
            </div>
          )}

          {/* Customer note */}
          <div className="input-group" style={{ marginTop: 4 }}>
            <label className="input-label">Note (optional)</label>
            <input className="input" placeholder="e.g. Regular customer, bulk order…" value={saleNote} onChange={e => setSaleNote(e.target.value)} />
          </div>

          {/* Credit toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Credit Sale (Khata)</div>
              <div style={{ fontSize: 12, color: "var(--ink-light)" }}>Customer will pay later</div>
            </div>
            <button onClick={() => setIsCredit(c => !c)} style={{
              width: 46, height: 26, borderRadius: 13, border: "none",
              background: isCredit ? "var(--rose)" : "var(--border)",
              cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0,
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", background: "white",
                position: "absolute", top: 3, left: isCredit ? 23 : 3,
                transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              }} />
            </button>
          </div>

          {/* Customer fields for credit */}
          {isCredit && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "10px 14px", background: "var(--rose-light)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--rose)" }}>📋 Customer Details (required for credit)</div>
              <input className="input" placeholder="Customer name *" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              <input className="input" type="tel" placeholder="Phone number (optional)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
            </div>
          )}

          {/* Payment mode — hidden for credit */}
          {!isCredit && (
            <div className="input-group" style={{ marginTop: 6 }}>
              <label className="input-label">Payment mode</label>
              <div className="toggle-group">
                <button className={`toggle-btn ${paymentMode === "cash" ? "active-cash" : ""}`} onClick={() => setPaymentMode("cash")}>💵 Cash</button>
                <button className={`toggle-btn ${paymentMode === "upi"  ? "active-upi"  : ""}`} onClick={() => setPaymentMode("upi")}>📲 UPI</button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0" }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Bill Total</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600 }}>₹{finalTotal}</span>
          </div>

          {isCredit && (
            <div style={{ textAlign: "center", padding: "8px", background: "var(--rose-light)", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--rose)", fontWeight: 600, marginBottom: 8 }}>
              ⚠️ This will be recorded as credit (unpaid)
            </div>
          )}

          <button className="btn btn-amber" onClick={handleSaveSale} disabled={saving}>
            {saving ? <span className="spinner" /> : "💾"} Save Sale
          </button>
        </div>
      )}

      {billData && <Bill sale={billData} profile={profile} onClose={() => setBillData(null)} />}
    </div>
  );
}
