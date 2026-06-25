import { StandardWebhooks } from "https://esm.sh/standardwebhooks@1.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const MAIL_FROM = Deno.env.get("MAIL_FROM")!;
const HOOK_SECRET = Deno.env.get("SEND_AUTH_EMAIL_HOOK_SECRET")!;

Deno.serve(async (req) => {
  const body = await req.text();

  // Verify Standard Webhooks signature
  const wh = new StandardWebhooks(HOOK_SECRET);
  try {
    wh.verify(body, {
      "webhook-id": req.headers.get("webhook-id") ?? "",
      "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
      "webhook-signature": req.headers.get("webhook-signature") ?? "",
    });
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const payload = JSON.parse(body);
  const { user, email_data } = payload;

  const email = user?.email;
  const name = user?.user_metadata?.full_name ?? "there";
  const token = email_data?.token;
  const actionType: string = email_data?.email_action_type ?? "signup";

  if (!email || !token) {
    return new Response(JSON.stringify({ error: "Missing email or token" }), { status: 400 });
  }

  let subject = "";
  let html = "";

  if (actionType === "signup" || actionType === "email_change_new") {
    subject = "Your FitwearGH verification code";
    html = otpEmailHtml(name, token, "Verify your email", "Enter this code to confirm your FitwearGH account:");
  } else if (actionType === "recovery") {
    subject = "Reset your FitwearGH password";
    html = otpEmailHtml(name, token, "Reset your password", "Enter this code to reset your FitwearGH password:");
  } else if (actionType === "magiclink") {
    subject = "Your FitwearGH sign-in code";
    html = otpEmailHtml(name, token, "Sign in to FitwearGH", "Enter this code to sign in:");
  } else {
    subject = "Your FitwearGH code";
    html = otpEmailHtml(name, token, "FitwearGH", "Your code:");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: MAIL_FROM, to: email, subject, html }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Resend error:", text);
    return new Response(JSON.stringify({ error: text }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});

function otpEmailHtml(name: string, token: string, heading: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FFFBF6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF6;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #DEDEDE;">
      <tr><td style="background:#533113;padding:28px 40px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:6px;font-weight:normal;">FITWEARGH</h1>
      </td></tr>
      <tr><td style="padding:36px 40px;">
        <p style="margin:0 0 12px;color:#533113;font-size:20px;">Hi ${name},</p>
        <p style="margin:0 0 8px;color:#533113;font-size:18px;font-weight:bold;">${heading}</p>
        <p style="margin:0 0 24px;color:#533113;font-size:15px;line-height:1.8;">${body}</p>
        <div style="background:#FFFBF6;border:1px solid #DEDEDE;padding:20px;text-align:center;margin-bottom:24px;">
          <span style="font-size:36px;letter-spacing:10px;color:#533113;font-weight:bold;">${token}</span>
        </div>
        <p style="margin:0;color:#533113;font-size:13px;line-height:1.8;opacity:0.7;">
          This code expires in 1 hour. If you didn't request this, ignore this email.
        </p>
      </td></tr>
      <tr><td style="padding:20px 40px;border-top:1px solid #DEDEDE;text-align:center;">
        <p style="margin:0;color:#533113;font-size:12px;opacity:0.5;">FitwearGH, Ghana. Questions? Reply to this email.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}
