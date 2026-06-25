import { useState, useRef, type FormEvent, type KeyboardEvent, type ClipboardEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import PasswordInput from "../../components/ui/PasswordInput";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromState = (location.state as { email?: string })?.email ?? "";

  const [step, setStep] = useState<"otp" | "password">("otp");
  const [email, setEmail] = useState(emailFromState);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
  ];

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    const next = [...otp];
    digits.forEach((d, i) => { next[i] = d; });
    setOtp(next);
    otpRefs[Math.min(digits.length, 5)].current?.focus();
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    const token = otp.join("");
    if (token.length < 6) { setError("Enter the 6-digit code."); return; }
    if (!email) { setError("Email is required."); return; }
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token, type: "recovery" });
      if (error) throw error;
      setStep("password");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setError(msg.includes("expired") || msg.includes("invalid")
        ? "Invalid or expired code. Request a new one."
        : msg || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      navigate("/account/login", { replace: true, state: { message: "Password updated. Please sign in." } });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setOtp(["", "", "", "", "", ""]);
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

          {step === "otp" ? (
            <>
              <div className="mb-8">
                <h1 className="raleway-bold text-3xl text-[#533113]">Enter reset code</h1>
                <p className="raleway-regular text-lg text-[#533113]/70 mt-2">
                  We sent a 6-digit code to{" "}
                  {email
                    ? <span className="raleway-bold text-[#533113]">{email}</span>
                    : "your email"}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 raleway-regular text-base px-4 py-3 mb-6">
                  {error}
                </div>
              )}

              {!emailFromState && (
                <div className="flex flex-col gap-2 mb-5">
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
              )}

              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
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
                  {loading ? "Verifying…" : "Verify code"}
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
          ) : (
            <>
              <div className="mb-8">
                <h1 className="raleway-bold text-3xl text-[#533113]">New password</h1>
                <p className="raleway-regular text-lg text-[#533113]/70 mt-2">
                  Choose a new password for your account
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 raleway-regular text-base px-4 py-3 mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">New password</label>
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
                  {loading ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}

          <p className="raleway-regular text-base text-[#533113]/70 text-center mt-6">
            <Link to="/account/login" className="raleway-bold text-[#533113] underline underline-offset-2">
              Back to sign in
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
