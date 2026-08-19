import { useState } from "react";
import { api } from "../api";

export default function LoginView({ onSuccess }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.login(user, pass);
      onSuccess();
    } catch (err) {
      setPass("");
      setError(err.message || "No se pudo iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <img className="login-logo" src="/logo-full.png" alt="Escobar Propiedades y Arte" />
        <h2>Acceso inmobiliaria</h2>
        <p className="login-hint">Ingresá con tus credenciales de administrador.</p>
        <label className="field-label">Usuario</label>
        <input className="input" value={user} onChange={(e) => setUser(e.target.value)} autoFocus autoComplete="username" />
        <label className="field-label">Contraseña</label>
        <input
          className="input"
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          autoComplete="current-password"
        />
        {error && <p className="error-text">{error}</p>}
        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
