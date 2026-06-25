import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import PasswordInput from "../../components/ui/PasswordInput";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg === "Admin accounts must sign in via the admin portal."
          ? msg
          : "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF6] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="raleway-bold text-3xl text-[#533113]">Sign in</h1>
            <p className="raleway-regular text-lg text-[#533113]/70 mt-2">
              Welcome back to FitwearGH
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 raleway-regular text-base px-4 py-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-base"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                Password
              </label>
              <PasswordInput
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#533113] text-white raleway-bold text-sm uppercase tracking-widest py-3.5 mt-1 hover:bg-[#3d2409] transition-colors disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>

            <p className="raleway-regular text-sm text-[#533113]/70 text-center">
              <Link to="/account/forgot-password" className="raleway-bold text-[#533113] underline underline-offset-2">
                Forgot password?
              </Link>
            </p>
          </form>

          <p className="raleway-regular text-base text-[#533113]/70 text-center mt-6">
            Don't have an account?{" "}
            <Link to="/account/register" className="raleway-bold text-[#533113] underline underline-offset-2">
              Create one
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
