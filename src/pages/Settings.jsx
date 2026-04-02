import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { showToast } from "../components/Toast";

export default function Settings() {
  const { session, profile, refreshProfile } = useAuth();
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name || "");
      setOwnerName(profile.owner_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!businessName.trim()) { showToast("⚠️ Business name required"); return; }
    setSaving(true);
    const { error } = await supabase.from("phoolbook_profiles")
      .update({ business_name: businessName.trim(), owner_name: ownerName.trim(), phone: phone.trim() })
      .eq("user_id", session.user.id);
    setSaving(false);
    if (error) { showToast("❌ " + error.message); return; }
    refreshProfile();
    showToast("✅ Profile updated");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="page">
      <div className="page-title">Settings</div>

      <div className="card">
        <div className="section-label">Business Profile</div>
        <div className="profile-form">
          <div className="input-group">
            <label className="input-label">Business Name</label>
            <input className="input" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="My Business" />
          </div>
          <div className="input-group">
            <label className="input-label">Your Name</label>
            <input className="input" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Owner name" />
          </div>
          <div className="input-group">
            <label className="input-label">Phone (for WhatsApp reports)</label>
            <input className="input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" /> : "💾"} Save Profile
          </button>
        </div>
      </div>

      <div className="card">
        <div className="section-label">Account</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="list-row" style={{ padding: "8px 0" }}>
            <span style={{ color: "var(--ink-muted)", fontSize: 14 }}>Email</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{session?.user?.email}</span>
          </div>
        </div>
      </div>

      <button className="btn btn-ghost" onClick={handleLogout} style={{ borderColor: "var(--rose)", color: "var(--rose)" }}>
        🚪 Sign Out
      </button>
    </div>
  );
}
