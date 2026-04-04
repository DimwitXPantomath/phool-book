import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { showToast } from "../components/Toast";

const TAX_PRESETS = [
  { label: "None", rate: 0 },
  { label: "GST 5%", rate: 5 },
  { label: "GST 12%", rate: 12 },
  { label: "GST 18%", rate: 18 },
  { label: "GST 28%", rate: 28 },
  { label: "Custom", rate: null },
];

const CHANNEL_OPTIONS = [
  { id: "zomato", label: "Zomato", emoji: "🔴" },
  { id: "swiggy", label: "Swiggy", emoji: "🟠" },
  { id: "online", label: "Other Online", emoji: "🌐" },
];

function SectionCard({ title, children }) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="section-label">{title}</div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 46, height: 26, borderRadius: 13, border: "none",
      background: value ? "var(--amber)" : "var(--border)",
      cursor: "pointer", position: "relative", transition: "background 0.2s",
      flexShrink: 0,
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: "50%", background: "white",
        position: "absolute", top: 3, left: value ? 23 : 3,
        transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

function ToggleRow({ label, sub, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: "var(--ink-light)" }}>{sub}</div>}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

export default function Settings() {
  const { session, profile, refreshProfile } = useAuth();
  const [tab, setTab] = useState("business");

  // Business profile
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName]       = useState("");
  const [phone, setPhone]               = useState("");
  const [address, setAddress]           = useState("");
  const [gstNumber, setGstNumber]       = useState("");

  // Ledger settings
  const [taxEnabled, setTaxEnabled]     = useState(false);
  const [taxLabel, setTaxLabel]         = useState("GST");
  const [taxRate, setTaxRate]           = useState("");
  const [taxPreset, setTaxPreset]       = useState("None");
  const [onlineEnabled, setOnlineEnabled] = useState(false);
  const [enabledChannels, setEnabledChannels] = useState([]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setBusinessName(profile.business_name || "");
    setOwnerName(profile.owner_name || "");
    setPhone(profile.phone || "");
    setAddress(profile.address || "");
    setGstNumber(profile.gst_number || "");
    setTaxEnabled(profile.tax_enabled || false);
    setTaxLabel(profile.tax_label || "GST");
    setTaxRate(profile.tax_rate ?? "");
    setOnlineEnabled(profile.online_channels_enabled || false);
    setEnabledChannels(profile.enabled_channels || []);
    const match = TAX_PRESETS.find(p => p.rate === Number(profile.tax_rate) && p.rate !== null);
    setTaxPreset(match ? match.label : profile.tax_rate ? "Custom" : "None");
  }, [profile]);

  const handlePresetClick = (preset) => {
    setTaxPreset(preset.label);
    if (preset.rate === 0) { setTaxEnabled(false); setTaxRate("0"); }
    else if (preset.rate !== null) { setTaxEnabled(true); setTaxRate(String(preset.rate)); }
    else { setTaxEnabled(true); setTaxRate(""); }
  };

  const toggleChannel = (id) => {
    setEnabledChannels(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!businessName.trim()) { showToast("⚠️ Business name required"); return; }
    if (taxEnabled && (!taxRate || isNaN(Number(taxRate)) || Number(taxRate) <= 0)) {
      showToast("⚠️ Enter a valid tax rate"); return;
    }
    setSaving(true);
    const { error } = await supabase.from("hisaabi_profiles").update({
      business_name: businessName.trim(),
      owner_name: ownerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      gst_number: gstNumber.trim().toUpperCase(),
      tax_enabled: taxEnabled,
      tax_label: taxLabel.trim() || "GST",
      tax_rate: taxEnabled ? Number(taxRate) : 0,
      online_channels_enabled: onlineEnabled,
      enabled_channels: onlineEnabled ? enabledChannels : [],
    }).eq("user_id", session.user.id);
    setSaving(false);
    if (error) { showToast("❌ " + error.message); return; }
    refreshProfile();
    showToast("✅ Settings saved");
  };

  const taxAmount = taxEnabled && taxRate ? parseFloat(((100 * Number(taxRate)) / 100).toFixed(2)) : 0;

  return (
    <div className="page">
      <div className="page-title">Settings</div>

      <div className="tab-bar">
        <button className={`tab-btn ${tab === "business" ? "active" : ""}`} onClick={() => setTab("business")}>🏪 Business</button>
        <button className={`tab-btn ${tab === "ledger" ? "active" : ""}`} onClick={() => setTab("ledger")}>⚙️ Ledger</button>
        <button className={`tab-btn ${tab === "account" ? "active" : ""}`} onClick={() => setTab("account")}>👤 Account</button>
      </div>

      {/* ── BUSINESS PROFILE ── */}
      {tab === "business" && (
        <>
          <SectionCard title="Business Details">
            <div className="input-group">
              <label className="input-label">Business Name *</label>
              <input className="input" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Nisha Florist" />
            </div>
            <div className="input-group">
              <label className="input-label">Owner / Contact Name</label>
              <input className="input" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <input className="input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div className="input-group">
              <label className="input-label">Business Address</label>
              <textarea
                className="input"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Shop No., Street, City, PIN"
                rows={2}
                style={{ resize: "none", lineHeight: 1.5 }}
              />
            </div>
          </SectionCard>

          <SectionCard title="Tax & Legal">
            <div className="input-group">
              <label className="input-label">GST Number</label>
              <input
                className="input"
                value={gstNumber}
                onChange={e => setGstNumber(e.target.value.toUpperCase())}
                placeholder="22AAAAA0000A1Z5"
                style={{ letterSpacing: "0.08em", fontFamily: "monospace", fontSize: 14 }}
                maxLength={15}
              />
              <span style={{ fontSize: 11, color: "var(--ink-light)", marginTop: 4 }}>
                Leave blank if not registered. Appears on printed bills.
              </span>
            </div>
          </SectionCard>

          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" /> : "💾"} Save Business Profile
          </button>
        </>
      )}

      {/* ── LEDGER SETTINGS ── */}
      {tab === "ledger" && (
        <>
          <SectionCard title="Tax Settings">
            <div>
              <label className="input-label" style={{ marginBottom: 8 }}>Quick Select</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
                {TAX_PRESETS.map(preset => (
                  <button key={preset.label} onClick={() => handlePresetClick(preset)} style={{
                    padding: "9px 6px", borderRadius: "var(--radius-sm)", border: "1.5px solid",
                    borderColor: taxPreset === preset.label ? "var(--amber)" : "var(--border)",
                    background: taxPreset === preset.label ? "var(--amber-pale)" : "var(--warm-white)",
                    color: taxPreset === preset.label ? "var(--amber)" : "var(--ink-muted)",
                    fontSize: 12, fontWeight: 700, fontFamily: "var(--font-body)", cursor: "pointer",
                    transition: "all var(--transition)",
                  }}>
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <ToggleRow
              label="Apply Tax on Bills"
              sub="Shows tax breakdown on printed receipt"
              value={taxEnabled}
              onChange={setTaxEnabled}
            />

            {taxEnabled && (
              <>
                <div style={{ display: "flex", gap: 10 }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Tax Label</label>
                    <input className="input" value={taxLabel} onChange={e => setTaxLabel(e.target.value)} placeholder="GST / VAT" />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Rate (%)</label>
                    <input className="input" type="number" value={taxRate}
                      onChange={e => { setTaxRate(e.target.value); setTaxPreset("Custom"); }}
                      placeholder="e.g. 18" min="0" max="100" step="0.5" />
                  </div>
                </div>

                {taxRate && Number(taxRate) > 0 && (
                  <div style={{
                    background: "var(--amber-pale)", border: "1px solid var(--amber-light)",
                    borderRadius: "var(--radius-sm)", padding: "10px 14px", fontSize: 13,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--ink-light)", marginBottom: 6 }}>Preview on ₹100</div>
                    {[["Subtotal", "₹100.00"], [`${taxLabel} (${taxRate}%)`, `₹${taxAmount.toFixed(2)}`]].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span>{k}</span><span>{v}</span></div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, borderTop: "1px solid var(--amber-light)", paddingTop: 6, marginTop: 4 }}>
                      <span>Total</span><span>₹{(100 + taxAmount).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </SectionCard>

          <SectionCard title="Online Channels">
            <ToggleRow
              label="Enable Online Sales Tracking"
              sub="Adds Zomato / Swiggy options on the sale screen"
              value={onlineEnabled}
              onChange={setOnlineEnabled}
            />

            {onlineEnabled && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label className="input-label">Select channels to show</label>
                {CHANNEL_OPTIONS.map(ch => (
                  <div key={ch.id} onClick={() => toggleChannel(ch.id)} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 14px", borderRadius: "var(--radius-sm)", cursor: "pointer",
                    border: "1.5px solid",
                    borderColor: enabledChannels.includes(ch.id) ? "var(--amber)" : "var(--border)",
                    background: enabledChannels.includes(ch.id) ? "var(--amber-pale)" : "var(--warm-white)",
                    transition: "all var(--transition)",
                  }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{ch.emoji} {ch.label}</span>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%", border: "2px solid",
                      borderColor: enabledChannels.includes(ch.id) ? "var(--amber)" : "var(--border)",
                      background: enabledChannels.includes(ch.id) ? "var(--amber)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, color: "white", fontWeight: 700,
                    }}>
                      {enabledChannels.includes(ch.id) ? "✓" : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" /> : "💾"} Save Ledger Settings
          </button>
        </>
      )}

      {/* ── ACCOUNT ── */}
      {tab === "account" && (
        <>
          <SectionCard title="Account Info">
            <div className="list-row" style={{ padding: "6px 0" }}>
              <span style={{ color: "var(--ink-muted)", fontSize: 14 }}>Email</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{session?.user?.email}</span>
            </div>
          </SectionCard>

          <button className="btn btn-ghost" onClick={() => supabase.auth.signOut()} style={{ borderColor: "var(--rose)", color: "var(--rose)" }}>
            🚪 Sign Out
          </button>
        </>
      )}
    </div>
  );
}
