import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PasswordInput from "../../components/ui/PasswordInput";

export default function AdminLogin() {
  const { loginAdmin: login } = useAuth();
  const navigate = useNavigate();
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
      navigate("/admin");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(msg === "Not an admin account." ? "This account does not have admin access." : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF6] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="raleway-bold text-3xl text-[#533113] tracking-widest uppercase">
            FitwearGH
          </h1>
          <p className="raleway-regular text-base text-[#533113]/60 mt-1 tracking-widest uppercase">
            Admin Dashboard
          </p>
        </div>

        <div className="bg-white border border-[#DEDEDE] p-8">
          <h2 className="raleway-bold text-xl text-[#533113] mb-6">Sign in</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 raleway-regular text-base px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fitweargh.com"
                className="border border-[#DEDEDE] px-4 py-3 raleway-regular text-base text-[#533113] outline-none focus:border-[#533113] transition-colors bg-transparent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                Password
              </label>
              <PasswordInput
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-[#DEDEDE] px-4 py-3 raleway-regular text-base text-[#533113] outline-none focus:border-[#533113] transition-colors bg-transparent w-full"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#533113] text-white raleway-bold text-sm uppercase tracking-widest py-3 mt-2 hover:bg-[#3d2409] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center raleway-regular text-sm text-[#533113]/40 mt-6">
          FitwearGH Admin — Authorised access only
        </p>
      </div>
    </div>
  );
}
