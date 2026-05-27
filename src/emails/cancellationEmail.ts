export interface CancellationEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  lineItems: { name: string; size?: string; color?: string; quantity: number; price: number }[];
  total: number;
}

export function cancellationEmailHtml({
  orderId,
  customerName,
  lineItems,
  total,
}: CancellationEmailData): string {
  const shortId = orderId.slice(0, 8).toUpperCase();

  const rows = lineItems
    .map(
      (i) => `
    <tr>
      <td style="padding:9px 0;border-bottom:1px solid #DEDEDE;color:#533113;font-size:14px;opacity:0.7;">
        ${i.name}${i.size ? ` — ${i.size}` : ""}${i.color ? ` / ${i.color}` : ""}
      </td>
      <td style="padding:9px 0;border-bottom:1px solid #DEDEDE;color:#533113;font-size:14px;text-align:center;opacity:0.7;">&#xD7;${i.quantity}</td>
      <td style="padding:9px 0;border-bottom:1px solid #DEDEDE;color:#533113;font-size:14px;text-align:right;opacity:0.7;">GH&#x20B5;${(i.price * i.quantity).toFixed(2)}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FFFBF6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF6;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #DEDEDE;">

      <tr><td style="background:#533113;padding:28px 40px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:6px;font-weight:normal;">FITWEARGH</h1>
      </td></tr>

      <tr><td style="padding:36px 40px 28px;">
        <p style="margin:0 0 4px;color:#533113;font-size:20px;">Order Cancelled</p>
        <p style="margin:0 0 20px;color:#533113;font-size:14px;opacity:0.6;">Hi ${customerName},</p>

        <p style="margin:0 0 24px;color:#533113;font-size:15px;line-height:1.8;">
          Your order <strong>#${shortId}</strong> has been cancelled.
          If you believe this is a mistake or have any questions, please reply to this email
          and our team will be happy to help.
        </p>

        <p style="margin:0 0 12px;color:#533113;font-size:11px;letter-spacing:2px;opacity:0.5;">CANCELLED ITEMS</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
          <thead>
            <tr>
              <th style="text-align:left;color:#533113;font-size:11px;letter-spacing:2px;padding-bottom:8px;border-bottom:2px solid #DEDEDE;opacity:0.6;">ITEM</th>
              <th style="text-align:center;color:#533113;font-size:11px;letter-spacing:2px;padding-bottom:8px;border-bottom:2px solid #DEDEDE;opacity:0.6;">QTY</th>
              <th style="text-align:right;color:#533113;font-size:11px;letter-spacing:2px;padding-bottom:8px;border-bottom:2px solid #DEDEDE;opacity:0.6;">PRICE</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td style="color:#533113;font-size:14px;opacity:0.6;">Order total</td>
            <td style="text-align:right;color:#533113;font-size:14px;opacity:0.6;">GH&#x20B5;${total.toFixed(2)}</td>
          </tr>
        </table>

        <a href="https://fitweargh.vercel.app/new-arrivals" style="display:inline-block;background:#533113;color:#ffffff;text-decoration:none;padding:14px 32px;font-size:12px;letter-spacing:3px;">
          BROWSE NEW ARRIVALS
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
