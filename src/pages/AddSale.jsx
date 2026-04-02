import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { showToast } from "../components/Toast";

export default function AddSale() {
  const { session } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [items, setItems] = useState([]);
  const [variants, setVariants] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState([]);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [finalPrice, setFinalPrice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);

  useEffect(() => {
    if (session) fetchItems();
  }, [session]);

  const fetchItems = async () => {
    const { data } = await supabase.from("phoolbook_items").select("*")
      .eq("user_id", session.user.id).order("name");
    setItems(data || []);
  };

  const fetchVariants = async (itemId) => {
    const { data } = await supabase.from("phoolbook_variants").select("*")
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
    const v = variants.find(v => v.id === variantId);
    setSelectedVariant(v || null);
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

  const cartTotal = cart.reduce((sum, i) => sum + i.total, 0);
  const finalTotal = finalPrice ? Number(finalPrice) : cartTotal;

  const updateQty = (index, delta) => {
    const updated = [...cart];
    updated[index].qty = Math.max(1, updated[index].qty + delta);
    updated[index].total = updated[index].qty * updated[index].price;
    setCart(updated);
  };

  const removeItem = (index) => setCart(cart.filter((_, i) => i !== index));

  const handleSaveSale = async () => {
    if (!cart.length) { showToast("⚠️ Cart is empty"); return; }

    // Offline save
    if (!isOnline) {
      const offlineSales = JSON.parse(localStorage.getItem("offline_sales") || "[]");
      offlineSales.push({ cart, cartTotal, finalTotal, paymentMode, created_at: new Date() });
      localStorage.setItem("offline_sales", JSON.stringify(offlineSales));
      showToast("📴 Saved offline — will sync later");
      setCart([]);
      setFinalPrice("");
      return;
    }

    setSaving(true);
    const { data: saleData, error } = await supabase.from("phoolbook_sales")
      .insert([{
        user_id: session.user.id,
        payment_mode: paymentMode,
        cart_total: cartTotal,
        final_total: finalTotal,
      }]).select();

    if (error) { showToast("❌ " + error.message); setSaving(false); return; }

    const itemsToInsert = cart.map(item => ({
      user_id: session.user.id,
      sale_id: saleData[0].id,
      variant_id: item.variant_id,
      qty: item.qty,
      price: item.price,
      total: item.total,
    }));

    await supabase.from("phoolbook_sale_items").insert(itemsToInsert);

    setSaving(false);
    showToast("✅ Sale saved!");
    setCart([]);
    setFinalPrice("");
    setSelectedItem("");
    setSelectedVariant(null);
    setVariants([]);
  };

  return (
    <div className="page">
      <div className="page-title">
        Record Sale
        {!isOnline && <span style={{ color: "var(--rose)", fontSize: 12 }}>📴 Offline mode</span>}
      </div>

      {/* Item selector */}
      <div className="input-group">
        <label className="input-label">Item</label>
        <select className="input" value={selectedItem} onChange={(e) => handleItemChange(e.target.value)}>
          <option value="">Select item…</option>
          {items.map(item => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </div>

      {/* Variant selector */}
      {variants.length > 0 && (
        <div className="input-group">
          <label className="input-label">Variant</label>
          <select className="input" value={selectedVariant?.id || ""} onChange={(e) => handleVariantChange(e.target.value)}>
            <option value="">Select variant…</option>
            {variants.map(v => (
              <option key={v.id} value={v.id}>{v.variant_name} — ₹{v.base_price}</option>
            ))}
          </select>
        </div>
      )}

      {/* Qty stepper */}
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
            <input
              className="input"
              type="number"
              placeholder={`₹${cartTotal}`}
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
            />
          </div>

          {finalPrice && Number(finalPrice) !== cartTotal && (
            <div style={{ textAlign: "right", color: "var(--rose)", fontSize: 13, fontWeight: 600 }}>
              Discount: ₹{cartTotal - Number(finalPrice)}
            </div>
          )}

          <div className="input-group" style={{ marginTop: 10 }}>
            <label className="input-label">Payment mode</label>
            <div className="toggle-group">
              <button
                className={`toggle-btn ${paymentMode === "cash" ? "active-cash" : ""}`}
                onClick={() => setPaymentMode("cash")}
              >
                💵 Cash
              </button>
              <button
                className={`toggle-btn ${paymentMode === "upi" ? "active-upi" : ""}`}
                onClick={() => setPaymentMode("upi")}
              >
                📲 UPI
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0" }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Bill Total</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, color: "var(--ink)" }}>₹{finalTotal}</span>
          </div>

          <button className="btn btn-amber" onClick={handleSaveSale} disabled={saving}>
            {saving ? <span className="spinner" /> : "💾"} Save Sale
          </button>
        </div>
      )}
    </div>
  );
}
