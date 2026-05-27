export interface StatusEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
}

const STATUS_COPY: Record<
  StatusEmailData["status"],
  { headline: string; body: string; badge: string }
> = {
  processing: {
    headline: "Your order is being processed",
    body: "Great news — we've confirmed your order and our team is now preparing it for dispatch. We'll let you know as soon as it ships.",
    badge: "#3b82f6",
  },
  shipped: {
    headline: "Your order is on its way!",
    body: "Your order has been handed to our delivery team and is heading your way. We'll contact you to arrange the handover.",
    badge: "#a855f7",
  },
  delivered: {
    headline: "Order delivered!",
    body: "Your order has been marked as delivered. We hope you love your new items! If you have any questions, just reply to this email.",
    badge: "#16a34a",
  },
  cancelled: {
    headline: "Your order has been cancelled",
    body: "Your order has been cancelled. If you believe this is a mistake or have any questions, please reply to this email and we'll sort it out straight away.",
    badge: "#ef4444",
  },
};

export function orderStatusHtml({ orderId, customerName, status, total }: StatusEmailData): string {
  const copy = STATUS_COPY[status];
  const shortId = orderId.slice(0, 8).toUpperCase();

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FFFBF6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF6;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #DEDEDE;">

      <tr><td style="background:#533113;padding:28px 40px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:6px;font-weight:normal;">FITWEARGH</h1>
      </td></tr>

      <tr><td style="padding:36px 40px 28px;">
        <p style="margin:0 0 4px;color:#533113;font-size:20px;">${copy.headline}</p>
        <p style="margin:0 0 20px;color:#533113;font-size:14px;opacity:0.6;">Hi ${customerName},</p>

        <p style="margin:0 0 24px;color:#533113;font-size:15px;line-height:1.8;">${copy.body}</p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF6;border:1px solid #DEDEDE;margin-bottom:28px;">
          <tr><td style="padding:16px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:#533113;font-size:11px;letter-spacing:2px;opacity:0.5;padding-bottom:6px;">ORDER REFERENCE</td>
                <td style="text-align:right;">
                  <span style="display:inline-block;background:${copy.badge};color:#fff;font-size:11px;letter-spacing:1px;padding:3px 10px;text-transform:uppercase;">${status}</span>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="color:#533113;font-size:15px;font-weight:bold;">#${shortId}</td>
              </tr>
              <tr>
                <td colspan="2" style="color:#533113;font-size:13px;opacity:0.6;padding-top:6px;">Order total: GH&#x20B5;${total.toFixed(2)}</td>
              </tr>
            </table>
          </td></tr>
        </table>

        <a href="https://fitweargh.vercel.app" style="display:inline-block;background:#533113;color:#ffffff;text-decoration:none;padding:14px 32px;font-size:12px;letter-spacing:3px;">
          CONTINUE SHOPPING
        </a>
      </td></tr>

      <tr><td style="padding:20px 40px;border-top:1px solid #DEDEDE;text-align:center;">
        <p style="margin:0;color:#533113;font-size:12px;opacity:0.5;">FitwearGH, Ghana. Questions? Reply to this email.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}
