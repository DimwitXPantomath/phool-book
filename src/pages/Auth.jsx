import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Auth() {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!email || !password) { setError("Please fill all fields"); return; }

    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      if (!businessName) { setError("Enter your business name"); setLoading(false); return; }
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); }
      else if (data.user) {
        // Update the auto-created profile with business name
        await supabase.from("phoolbook_profiles")
          .update({ business_name: businessName })
          .eq("user_id", data.user.id);
        setSuccess("Account created! Check your email to confirm.");
      }
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">📒 Phool Book</div>
        <div className="auth-sub">
          {mode === "login" ? "Sign in to your ledger" : "Create your business ledger"}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "signup" && (
            <div className="input-group">
              <label className="input-label">Business Name</label>
              <input
                className="input"
                placeholder="e.g. Nisha Florist / Dimwit Bakes"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          {error && (
            <div style={{
              background: "var(--rose-light)", color: "var(--rose)",
              padding: "10px 14px", borderRadius: "var(--radius-sm)",
              fontSize: 13, fontWeight: 500
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              background: "var(--green-light)", color: "var(--green)",
              padding: "10px 14px", borderRadius: "var(--radius-sm)",
              fontSize: 13, fontWeight: 500
            }}>
              {success}
            </div>
          )}

          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>

          <button
            className="btn btn-ghost"
            onClick={() => { setMode(m => m === "login" ? "signup" : "login"); setError(""); setSuccess(""); }}
          >
            {mode === "login" ? "New here? Create account" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
