import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../services/authApi.js";
import { Card } from "../components/ui/Card.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Button } from "../components/ui/Button.jsx";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.forgotPassword(email);
      setMsg(data.message);
    } catch (err) {
      setMsg(err.displayMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-display text-2xl font-bold mb-6 dark:text-white">Forgot password</h1>
      <Card className="p-6" glass>
        <form onSubmit={submit} className="space-y-4">
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          {msg && <p className="text-sm text-slate-600 dark:text-slate-400">{msg}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            Send reset link
          </Button>
          <Link to="/login" className="block text-center text-sm text-brand-600">
            Back to login
          </Link>
        </form>
      </Card>
    </div>
  );
}
