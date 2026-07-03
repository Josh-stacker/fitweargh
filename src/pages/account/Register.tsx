import { useState, useRef, type FormEvent, type KeyboardEvent, type ClipboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../supabase";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import PasswordInput from "../../components/ui/PasswordInput";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<"form" | "otp">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await register(name, email, password);
      setStep("otp");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("already registered") || msg.includes("already-in-use")) {
        setError("An account with this email already exists.");
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 7) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8).split("");
    const next = [...otp];
    digits.forEach((d, i) => { next[i] = d; });
    setOtp(next);
    otpRefs[Math.min(digits.length, 7)].current?.focus();
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    const token = otp.join("");
    if (token.length < 8) { setError("Enter the 8-digit code."); return; }
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
      if (error) throw error;
      navigate("/account", { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("expired") || msg.includes("invalid")) {
        setError("Invalid or expired code. Request a new one.");
      } else {
        setError(msg || "Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      setOtp(["", "", "", "", "", "", "", ""]);
      otpRefs[0].current?.focus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF6] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">

          {step === "form" ? (
            <>
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
                  <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">Full name</label>
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
                  <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">Email address</label>
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
                  <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">Password</label>
                  <PasswordInput
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">Confirm password</label>
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
            </>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="raleway-bold text-3xl text-[#533113]">Verify your email</h1>
                <p className="raleway-regular text-lg text-[#533113]/70 mt-2">
                  We sent an 8-digit code to <span className="raleway-bold text-[#533113]">{email}</span>
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 raleway-regular text-base px-4 py-3 mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerify} className="flex flex-col gap-6">
                <div className="flex gap-3 justify-between">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={otpRefs[i]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      className="w-full aspect-square text-center text-2xl raleway-bold text-[#533113] border border-[#DEDEDE] bg-white focus:outline-none focus:border-[#533113] transition-colors"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#533113] text-white raleway-bold text-sm uppercase tracking-widest py-3.5 hover:bg-[#3d2409] transition-colors disabled:opacity-60"
                >
                  {loading ? "Verifying…" : "Verify email"}
                </button>
              </form>

              <p className="raleway-regular text-base text-[#533113]/70 text-center mt-6">
                Didn't receive a code?{" "}
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="raleway-bold text-[#533113] underline underline-offset-2 disabled:opacity-50"
                >
                  {resending ? "Sending…" : "Resend code"}
                </button>
              </p>
            </>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
