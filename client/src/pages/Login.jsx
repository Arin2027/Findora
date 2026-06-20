import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/authApi.js";
import { useAuth } from "../hooks/useAuth.js";
import { Card } from "../components/ui/Card.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Button } from "../components/ui/Button.jsx";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await authApi.login({ email, password });
      login(data.token, data.user, data.refreshToken);
      navigate("/dashboard");
    } catch (err) {
      setError(err.displayMessage || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-display text-3xl font-bold mb-6 dark:text-white">Welcome back</h1>
      <Card className="p-6" glass>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-xl bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 text-sm px-3 py-2">{error}</div>}
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            <Link to="/forgot-password" className="text-brand-600 hover:underline">Forgot password?</Link>
          </p>
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            No account? <Link to="/register" className="text-brand-600 font-medium">Register</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
