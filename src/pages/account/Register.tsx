import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import PasswordInput from "../../components/ui/PasswordInput";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/account", { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("email-already-in-use")) {
        setError("An account with this email already exists.");
      } else {
        setError("Something went wrong. Please try again.");
      }
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
            <h1 className="raleway-bold text-3xl text-[#533113]">Create account</h1>
            <p className="raleway-regular text-lg text-[#533113]/70 mt-2">
              Join FitwearGH for a better shopping experience
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
                Full name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ama Mensah"
                className="input-base"
              />
            </div>

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
                placeholder="Min. 6 characters"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                Confirm password
              </label>
              <PasswordInput
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#533113] text-white raleway-bold text-sm uppercase tracking-widest py-3.5 mt-1 hover:bg-[#3d2409] transition-colors disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="raleway-regular text-base text-[#533113]/70 text-center mt-6">
            Already have an account?{" "}
            <Link to="/account/login" className="raleway-bold text-[#533113] underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
