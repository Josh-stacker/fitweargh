const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const MAIL_FROM = Deno.env.get("MAIL_AUTH_FROM") ?? Deno.env.get("MAIL_FROM")!;

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { user, email_data } = payload;

    const email = user?.email;
    const name = user?.user_metadata?.full_name ?? "there";
    const token = email_data?.token;
    const actionType: string = email_data?.email_action_type ?? "signup";

    if (!email || !token) {
      return json({ error: "Missing email or token" }, 400);
    }

    let subject = "";
    let html = "";

    if (actionType === "signup" || actionType === "email_change_new") {
      subject = "Your FitwearGH verification code";
      html = otpEmailHtml(name, token, "Verify your email", "Enter this code to confirm your FitwearGH account:");
    } else if (actionType === "recovery") {
      subject = "Reset your FitwearGH password";
      html = otpEmailHtml(name, token, "Reset your password", "Enter this code to reset your FitwearGH password:");
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
      return json({ error: text }, 500);
    }

    return json({ ok: true });
  } catch (err) {
    console.error("Hook error:", err);
    return json({ error: String(err) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

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
