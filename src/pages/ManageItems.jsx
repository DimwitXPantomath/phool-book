import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { showToast } from "../components/Toast";

export default function ManageItems() {
  const { session } = useAuth();
  const [tab, setTab] = useState("items");
  const [items, setItems] = useState([]);
  const [variants, setVariants] = useState([]);
  const [itemName, setItemName] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [variantName, setVariantName] = useState("");
  const [variantPrice, setVariantPrice] = useState("");

  useEffect(() => { if (session) fetchItems(); }, [session]);

  const fetchItems = async () => {
    const { data } = await supabase.from("hisaabi_items").select("*")
      .eq("user_id", session.user.id).order("name");
    setItems(data || []);
  };

  const fetchVariants = async (itemId) => {
    if (!itemId) { setVariants([]); return; }
    const { data } = await supabase.from("hisaabi_variants").select("*")
      .eq("item_id", itemId).eq("user_id", session.user.id).order("variant_name");
    setVariants(data || []);
  };

  const addItem = async () => {
    if (!itemName.trim()) { showToast("⚠️ Enter item name"); return; }
    const { error } = await supabase.from("hisaabi_items")
      .insert([{ user_id: session.user.id, name: itemName.trim() }]);
    if (error) { showToast("❌ " + error.message); return; }
    showToast("✅ Item added");
    setItemName("");
    fetchItems();
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this item and all its variants?")) return;
    await supabase.from("hisaabi_items").delete().eq("id", id).eq("user_id", session.user.id);
    showToast("🗑️ Item deleted");
    fetchItems();
  };

  const addVariant = async () => {
    if (!selectedItemId || !variantName.trim() || !variantPrice) {
      showToast("⚠️ Fill all fields"); return;
    }
    const { error } = await supabase.from("hisaabi_variants").insert([{
      user_id: session.user.id,
      item_id: selectedItemId,
      variant_name: variantName.trim(),
      base_price: Number(variantPrice),
    }]);
    if (error) { showToast("❌ " + error.message); return; }
    showToast("✅ Variant added");
    setVariantName("");
    setVariantPrice("");
    fetchVariants(selectedItemId);
  };

  const deleteVariant = async (id) => {
    if (!window.confirm("Delete this variant?")) return;
    await supabase.from("hisaabi_variants").delete().eq("id", id).eq("user_id", session.user.id);
    showToast("🗑️ Variant deleted");
    fetchVariants(selectedItemId);
  };

  return (
    <div className="page">
      <div className="page-title">Manage Catalogue</div>

      <div className="tab-bar">
        <button className={`tab-btn ${tab === "items" ? "active" : ""}`} onClick={() => setTab("items")}>📦 Items</button>
        <button className={`tab-btn ${tab === "variants" ? "active" : ""}`} onClick={() => setTab("variants")}>🌹 Variants</button>
      </div>

      {tab === "items" && (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="input"
              placeholder="Item name…"
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addItem()}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" style={{ width: "auto", padding: "0 18px" }} onClick={addItem}>Add</button>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {items.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📦</div><p>No items yet</p></div>
            ) : items.map(item => (
              <div key={item.id} className="list-row" style={{ padding: "12px 16px" }}>
                <span style={{ fontWeight: 500 }}>{item.name}</span>
                <button className="btn btn-danger btn-sm" onClick={() => deleteItem(item.id)}>Delete</button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "variants" && (
        <>
          <div className="input-group">
            <label className="input-label">Select Item</label>
            <select className="input" value={selectedItemId} onChange={e => { setSelectedItemId(e.target.value); fetchVariants(e.target.value); }}>
              <option value="">Choose item…</option>
              {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>

          {selectedItemId && (
            <>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="input" placeholder="Variant name" value={variantName} onChange={e => setVariantName(e.target.value)} style={{ flex: 2 }} />
                <input className="input" type="number" placeholder="₹ Price" value={variantPrice} onChange={e => setVariantPrice(e.target.value)} style={{ flex: 1 }} />
              </div>
              <button className="btn btn-primary" onClick={addVariant}>+ Add Variant</button>

              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                {variants.length === 0 ? (
                  <div className="empty-state"><div className="empty-icon">🌹</div><p>No variants yet</p></div>
                ) : variants.map(v => (
                  <div key={v.id} className="list-row" style={{ padding: "12px 16px" }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{v.variant_name}</div>
                      <div style={{ fontSize: 13, color: "var(--ink-light)" }}>₹{v.base_price}</div>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteVariant(v.id)}>Delete</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
