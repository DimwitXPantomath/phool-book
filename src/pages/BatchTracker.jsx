import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { showToast } from "../components/Toast";

function formatDateTime(dt) {
  return new Date(dt).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function daysAgo(dt) {
  const diff = (Date.now() - new Date(dt)) / (1000 * 60 * 60 * 24);
  if (diff < 1) return "Today";
  if (diff < 2) return "Yesterday";
  return `${Math.floor(diff)} days ago`;
}

export default function BatchTracker() {
  const { session } = useAuth();
  const [items, setItems] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filterItem, setFilterItem] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [itemId, setItemId] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [bakedAt, setBakedAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [qtyProduced, setQtyProduced] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (session) { fetchItems(); fetchBatches(); } }, [session]);

  const fetchItems = async () => {
    const { data } = await supabase.from("hisaabi_items").select("*")
      .eq("user_id", session.user.id).order("name");
    setItems(data || []);
  };

  const fetchBatches = async (itemFilter = "") => {
    let query = supabase.from("hisaabi_batches")
      .select(`*, hisaabi_items(name)`)
      .eq("user_id", session.user.id)
      .order("baked_at", { ascending: false });
    if (itemFilter) query = query.eq("item_id", itemFilter);
    const { data } = await query;
    setBatches(data || []);
  };

  const handleFilterChange = (id) => {
    setFilterItem(id);
    fetchBatches(id);
  };

  const handleSave = async () => {
    if (!itemId || !batchNumber.trim() || !bakedAt || !qtyProduced) {
      showToast("⚠️ Fill all required fields");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("hisaabi_batches").insert([{
      user_id: session.user.id,
      item_id: itemId,
      batch_number: batchNumber.trim().toUpperCase(),
      baked_at: new Date(bakedAt).toISOString(),
      qty_produced: Number(qtyProduced),
      qty_remaining: Number(qtyProduced),
      notes: notes.trim(),
    }]);
    setSaving(false);
    if (error) { showToast("❌ " + error.message); return; }
    showToast("✅ Batch logged!");
    setBatchNumber("");
    setQtyProduced("");
    setNotes("");
    setShowForm(false);
    fetchBatches(filterItem);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this batch record?")) return;
    await supabase.from("hisaabi_batches").delete().eq("id", id).eq("user_id", session.user.id);
    showToast("🗑️ Batch deleted");
    fetchBatches(filterItem);
  };

  // Group batches by item for summary view
  const grouped = batches.reduce((acc, b) => {
    const name = b.hisaabi_items?.name || "Unknown";
    if (!acc[name]) acc[name] = [];
    acc[name].push(b);
    return acc;
  }, {});

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div className="page-title">
          Batch Tracker
          <span>Log baking batches by date & item</span>
        </div>
        <button
          className="btn btn-amber"
          style={{ width: "auto", padding: "10px 16px", marginTop: 4 }}
          onClick={() => setShowForm(f => !f)}
        >
          {showForm ? "✕ Cancel" : "+ New Batch"}
        </button>
      </div>

      {/* Add batch form */}
      {showForm && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14, background: "var(--amber-pale)", borderColor: "var(--amber-light)" }}>
          <div className="section-label" style={{ color: "var(--amber)" }}>New Batch Entry</div>

          <div className="input-group">
            <label className="input-label">Item *</label>
            <select className="input" value={itemId} onChange={e => setItemId(e.target.value)}>
              <option value="">Select item…</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Batch No. *</label>
              <input
                className="input"
                placeholder="e.g. B-042"
                value={batchNumber}
                onChange={e => setBatchNumber(e.target.value)}
                style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}
              />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Qty Produced *</label>
              <input
                className="input"
                type="number"
                placeholder="0"
                value={qtyProduced}
                onChange={e => setQtyProduced(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Date & Time Baked *</label>
            <input
              className="input"
              type="datetime-local"
              value={bakedAt}
              onChange={e => setBakedAt(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Notes (optional)</label>
            <input
              className="input"
              placeholder="e.g. Extra vanilla, oven temp adjusted…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <button className="btn btn-amber" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" /> : "🍞"} Log Batch
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="input-group">
        <label className="input-label">Filter by item</label>
        <select className="input" value={filterItem} onChange={e => handleFilterChange(e.target.value)}>
          <option value="">All items</option>
          {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </div>

      {/* Batch list */}
      {batches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🍞</div>
          <p>No batches logged yet</p>
        </div>
      ) : Object.entries(grouped).map(([itemName, itemBatches]) => (
        <div key={itemName}>
          <div className="section-label">{itemName}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {itemBatches.map(b => (
              <div key={b.id} className="batch-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div className="batch-number">#{b.batch_number}</div>
                  <button
                    onClick={() => handleDelete(b.id)}
                    style={{ border: "none", background: "transparent", color: "var(--ink-light)", cursor: "pointer", fontSize: 16, padding: 0 }}
                  >
                    ✕
                  </button>
                </div>

                <div className="batch-meta">
                  <span className="badge badge-amber">🕐 {daysAgo(b.baked_at)}</span>
                  <span className="badge badge-ink">🍞 {b.qty_produced} produced</span>
                  {b.qty_remaining !== b.qty_produced && (
                    <span className="badge badge-green">{b.qty_remaining} left</span>
                  )}
                </div>

                <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                  Baked: {formatDateTime(b.baked_at)}
                </div>

                {b.notes && (
                  <div style={{ fontSize: 13, color: "var(--ink-light)", fontStyle: "italic" }}>
                    "{b.notes}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
