import { useState } from "react";
import { supabase } from "../lib/supabase";

function PasswordInput({ label, value, onChange, onKeyDown, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <div style={{ position: "relative" }}>
        <input
          className="input"
          type={show ? "text" : "password"}
          placeholder={placeholder || "••••••••"}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          style={{ paddingRight: 44 }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{
            position: "absolute", right: 12, top: "50%",
            transform: "translateY(-50%)", border: "none",
            background: "transparent", cursor: "pointer",
            fontSize: 16, color: "var(--ink-light)", padding: 0,
            lineHeight: 1,
          }}
        >
          {show ? "🙈" : "👁️"}
        </button>
      </div>
    </div>
  );
}

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setSuccess("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) { setError(error.message); setGoogleLoading(false); }
    // On success Supabase redirects — no need to setLoading(false)
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!email || !password) { setError("Please fill all fields"); return; }

    if (mode === "signup") {
      if (!businessName.trim()) { setError("Enter your business name"); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
      if (password !== confirmPassword) { setError("Passwords don't match"); return; }
    }

    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { business_name: businessName.trim() }, // stored in user metadata
        },
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        // Upsert profile — handles both trigger-created and missing profiles
        await supabase.from("hisaabi_profiles").upsert({
          user_id: data.user.id,
          business_name: businessName.trim(),
        }, { onConflict: "user_id" });

        if (data.session) {
          // Email confirmations disabled — user is logged in immediately
        } else {
          setSuccess("Account created! Check your email to confirm, then sign in.");
        }
      }
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">📒 Hisaabi</div>
        <div className="auth-sub">
          {mode === "login" ? "Aapka rozana hisaab" : "Nayi dukaan shuru karein"}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Google login */}
          <button
            className="btn btn-ghost"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            style={{ gap: 10, fontSize: 15 }}
          >
            {googleLoading
              ? <span className="spinner" />
              : <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
            }
            Continue with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 12, color: "var(--ink-light)", fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* Email/password form */}
          {mode === "signup" && (
            <div className="input-group">
              <label className="input-label">Business Name</label>
              <input
                className="input"
                placeholder="e.g. Nisha Florist, Dimwit Bakes…"
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

          <PasswordInput
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => mode === "login" && e.key === "Enter" && handleSubmit()}
          />

          {mode === "signup" && (
            <PasswordInput
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          )}

          {error && (
            <div style={{
              background: "var(--rose-light)", color: "var(--rose)",
              padding: "10px 14px", borderRadius: "var(--radius-sm)",
              fontSize: 13, fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              background: "var(--green-light)", color: "var(--green)",
              padding: "10px 14px", borderRadius: "var(--radius-sm)",
              fontSize: 13, fontWeight: 500,
            }}>
              {success}
            </div>
          )}

          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>

          <button className="btn btn-ghost" onClick={() => switchMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "New here? Create account" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
