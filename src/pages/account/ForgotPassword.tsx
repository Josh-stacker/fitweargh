import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabase";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF6] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {sent ? (
            <>
              <div className="mb-8">
                <h1 className="raleway-bold text-3xl text-[#533113]">Check your email</h1>
                <p className="raleway-regular text-lg text-[#533113]/70 mt-2">
                  We sent a password reset code to <span className="raleway-bold text-[#533113]">{email}</span>
                </p>
              </div>
              <Link
                to="/account/reset-password"
                state={{ email }}
                className="block w-full bg-[#533113] text-white raleway-bold text-sm uppercase tracking-widest py-3.5 text-center hover:bg-[#3d2409] transition-colors"
              >
                Enter reset code
              </Link>
              <p className="raleway-regular text-base text-[#533113]/70 text-center mt-6">
                <Link to="/account/login" className="raleway-bold text-[#533113] underline underline-offset-2">
                  Back to sign in
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="raleway-bold text-3xl text-[#533113]">Forgot password?</h1>
                <p className="raleway-regular text-lg text-[#533113]/70 mt-2">
                  Enter your email and we'll send you a reset code
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

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#533113] text-white raleway-bold text-sm uppercase tracking-widest py-3.5 mt-1 hover:bg-[#3d2409] transition-colors disabled:opacity-60"
                >
                  {loading ? "Sending…" : "Send reset code"}
                </button>
              </form>

              <p className="raleway-regular text-base text-[#533113]/70 text-center mt-6">
                <Link to="/account/login" className="raleway-bold text-[#533113] underline underline-offset-2">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
