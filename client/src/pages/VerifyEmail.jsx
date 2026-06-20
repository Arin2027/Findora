import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authApi } from "../services/authApi.js";
import { useAuth } from "../hooks/useAuth.js";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";

export function VerifyEmail() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    const token = params.get("token");
    if (!token) return;
    authApi
      .verifyEmail(token)
      .then(() => setStatus("verified"))
      .catch(() => setStatus("error"));
  }, [params]);

  const resend = async () => {
    try {
      await authApi.resendVerification();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="max-w-md mx-auto text-center">
      <Card className="p-8" glass>
        {status === "verified" && <p className="text-emerald-600 font-medium">Email verified!</p>}
        {status === "pending" && (
          <>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Check your inbox for a verification link.</p>
            {user && (
              <Button type="button" onClick={resend}>
                Resend email
              </Button>
            )}
          </>
        )}
        {status === "sent" && <p className="text-brand-600">Verification email sent.</p>}
        {status === "error" && <p className="text-red-600">Verification failed. Try again.</p>}
        <Link to="/dashboard" className="block mt-6 text-brand-600 text-sm">
          Go to dashboard
        </Link>
      </Card>
    </div>
  );
}
