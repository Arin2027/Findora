import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { authApi } from "../services/authApi.js";
import { Card } from "../components/ui/Card.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Button } from "../components/ui/Button.jsx";

export function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authApi.resetPassword({ token: token || undefined, otp: otp || undefined, password });
      navigate("/login");
    } catch (err) {
      setError(err.displayMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-display text-2xl font-bold mb-6 dark:text-white">Reset password</h1>
      <Card className="p-6" glass>
        <form onSubmit={submit} className="space-y-4">
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {!token && <Input label="OTP (from email)" value={otp} onChange={(e) => setOtp(e.target.value)} />}
          <Input label="New password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" disabled={loading} className="w-full">
            Update password
          </Button>
          <Link to="/login" className="block text-center text-sm text-brand-600">
            Login
          </Link>
        </form>
      </Card>
    </div>
  );
}
