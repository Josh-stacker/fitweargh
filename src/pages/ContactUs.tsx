import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ArrowLeftIcon, PaperPlaneRightIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { queueAndSendMail } from "../lib/mail";
import { getOrderAdminEmails } from "../lib/adminEmails";

function ContactUs() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");

    try {
      const adminEmails = await getOrderAdminEmails();
      const userConfirmHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;background:#FFFBF6;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF6;padding:40px 16px;">
            <tr><td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #DEDEDE;">
                <tr><td style="background:#533113;padding:28px 40px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:6px;font-weight:normal;">FITWEARGH</h1>
                </td></tr>
                <tr><td style="padding:36px 40px 24px;">
                  <p style="margin:0 0 12px;color:#533113;font-size:18px;">We received your message!</p>
                  <p style="margin:0 0 20px;color:#533113;font-size:14px;line-height:1.7;">Hi ${form.name}, thank you for reaching out. We'll get back to you as soon as possible.</p>
                  <p style="margin:0;color:#533113;font-size:14px;opacity:0.6;">Your message subject: <strong>${form.subject}</strong></p>
                </td></tr>
                <tr><td style="padding:20px 40px;border-top:1px solid #DEDEDE;text-align:center;">
                  <p style="margin:0;color:#533113;font-size:12px;opacity:0.5;">FitwearGH &bull; fitweargh1@gmail.com</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `;
      const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;background:#FFFBF6;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF6;padding:40px 16px;">
            <tr><td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #DEDEDE;">
                <tr><td style="background:#533113;padding:28px 40px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:6px;font-weight:normal;">FITWEARGH</h1>
                </td></tr>
                <tr><td style="padding:36px 40px 24px;">
                  <p style="margin:0 0 20px;color:#533113;font-size:20px;">New Contact Form Message</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr><td style="padding:6px 0;color:#533113;font-size:14px;opacity:0.5;width:100px;">Name</td>
                        <td style="padding:6px 0;color:#533113;font-size:14px;">${form.name}</td></tr>
                    <tr><td style="padding:6px 0;color:#533113;font-size:14px;opacity:0.5;">Email</td>
                        <td style="padding:6px 0;color:#533113;font-size:14px;">${form.email}</td></tr>
                    <tr><td style="padding:6px 0;color:#533113;font-size:14px;opacity:0.5;">Phone</td>
                        <td style="padding:6px 0;color:#533113;font-size:14px;">${form.phone}</td></tr>
                    <tr><td style="padding:6px 0;color:#533113;font-size:14px;opacity:0.5;">Subject</td>
                        <td style="padding:6px 0;color:#533113;font-size:14px;">${form.subject}</td></tr>
                  </table>
                  <div style="margin-top:20px;padding:16px;background:#FFFBF6;border:1px solid #DEDEDE;">
                    <p style="margin:0;color:#533113;font-size:14px;line-height:1.7;white-space:pre-wrap;">${form.message}</p>
                  </div>
                </td></tr>
                <tr><td style="padding:20px 40px;border-top:1px solid #DEDEDE;text-align:center;">
                  <p style="margin:0;color:#533113;font-size:12px;opacity:0.5;">Sent from the FitwearGH Contact Us page</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `;

      await queueAndSendMail([
        ...adminEmails.map((email) => ({
          to: email,
          subject: `Contact Form: ${form.subject || "New Message"} from ${form.name}`,
          html,
        })),
        {
          to: form.email,
          subject: "We received your message – FitwearGH",
          html: userConfirmHtml,
        },
      ]);

      setSent(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      setError("Failed to send message. Please try again or email us directly at fitweargh1@gmail.com.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF6]">
      <Navbar />

      <div className="max-w-[1440px] 2xl:max-w-[1620px] mx-auto px-4 md:px-10 mt-8 mb-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[#533113] raleway-regular text-sm mb-8 hover:underline"
        >
          <ArrowLeftIcon size={16} />
          Back to Home
        </Link>

        <h1 className="text-3xl md:text-4xl raleway-bold text-[#533113] mb-2">
          Contact Us
        </h1>
        <p className="text-base text-[#533113]/70 raleway-regular mb-12 max-w-2xl">
          Have a question, complaint, or feedback? Fill out the form below and we'll get back to you as soon as possible.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact info */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-[#DEDEDE] p-6 space-y-6">
              <div>
                <p className="raleway-bold text-xs text-[#533113] uppercase tracking-widest mb-2">
                  Email
                </p>
                <a
                  href="mailto:fitweargh1@gmail.com"
                  className="text-sm raleway-regular text-[#533113] hover:underline"
                >
                  fitweargh1@gmail.com
                </a>
              </div>
              <div>
                <p className="raleway-bold text-xs text-[#533113] uppercase tracking-widest mb-2">
                  Phone
                </p>
                <a
                  href="tel:0559506998"
                  className="text-sm raleway-regular text-[#533113] hover:underline"
                >
                  0559506998
                </a>
              </div>
              <div>
                <p className="raleway-bold text-xs text-[#533113] uppercase tracking-widest mb-2">
                  Social
                </p>
                <div className="flex flex-col gap-1.5">
                  <a
                    href="https://www.instagram.com/fitwearghana"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm raleway-regular text-[#533113] hover:underline"
                  >
                    Instagram
                  </a>
                  <a
                    href="https://www.facebook.com/share/1Dj77MGvkx/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm raleway-regular text-[#533113] hover:underline"
                  >
                    Facebook
                  </a>
                </div>
              </div>
              <div>
                <p className="raleway-bold text-xs text-[#533113] uppercase tracking-widest mb-2">
                  Location
                </p>
                <p className="text-sm raleway-regular text-[#533113]/80">
                  Ghana
                </p>
              </div>
              <div>
                <p className="raleway-bold text-xs text-[#533113] uppercase tracking-widest mb-2">
                  Quick Links
                </p>
                <div className="flex flex-col gap-1.5">
                  <Link to="/privacy-policy" className="text-sm raleway-regular text-[#533113] hover:underline">
                    Privacy Policy
                  </Link>
                  <Link to="/terms-and-conditions" className="text-sm raleway-regular text-[#533113] hover:underline">
                    Terms and Conditions
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            {sent ? (
              <div className="bg-white border border-[#DEDEDE] p-10 text-center">
                <CheckCircleIcon size={48} className="text-[#533113] mx-auto mb-4" weight="fill" />
                <h2 className="text-xl raleway-bold text-[#533113] mb-2">Message Sent!</h2>
                <p className="text-sm raleway-regular text-[#533113]/70 mb-6">
                  Thank you for reaching out. We'll get back to you shortly.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="bg-[#533113] text-white px-6 py-2.5 raleway-regular text-sm hover:bg-[#3d2409] transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white border border-[#DEDEDE] p-6 md:p-8 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="input-base"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="input-base"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="input-base"
                      placeholder="+233 XX XXX XXXX"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      required
                      className="input-base"
                    >
                      <option value="">Select a subject</option>
                      <option value="Order Inquiry">Order Inquiry</option>
                      <option value="Delivery Question">Delivery Question</option>
                      <option value="Return or Exchange">Return or Exchange</option>
                      <option value="Product Question">Product Question</option>
                      <option value="Complaint">Complaint</option>
                      <option value="Feedback">Feedback</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="input-base resize-y min-h-[120px]"
                    placeholder="How can we help you?"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 raleway-regular">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="bg-[#533113] text-white px-6 py-3 raleway-regular text-sm flex items-center gap-2 hover:bg-[#3d2409] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <PaperPlaneRightIcon size={16} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default ContactUs;
