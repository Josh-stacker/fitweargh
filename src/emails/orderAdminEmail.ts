import type { OrderEmailData } from "./orderConfirmEmail";

export function orderAdminHtml({ orderId, form, items, total, deliveryFee, grandTotal, shippingMethod }: OrderEmailData): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #ddd;">

      <tr><td style="background:#533113;padding:20px 32px;">
        <h2 style="margin:0;color:#fff;font-size:16px;font-weight:normal;letter-spacing:3px;">NEW ORDER — FITWEARGH</h2>
      </td></tr>

      <tr><td style="padding:28px 32px;">
        <p style="margin:0 0 4px;font-size:12px;color:#888;letter-spacing:2px;">ORDER REF</p>
        <p style="margin:0 0 24px;font-size:17px;font-weight:bold;color:#533113;">#${orderId.slice(0, 8).toUpperCase()}</p>

        <p style="margin:0 0 4px;font-size:12px;color:#888;letter-spacing:2px;">CUSTOMER</p>
        <p style="margin:0 0 2px;font-size:15px;color:#333;">${form.name}</p>
        <p style="margin:0 0 2px;font-size:14px;color:#555;">${form.email}</p>
        <p style="margin:0 0 24px;font-size:14px;color:#555;">${form.phone}</p>

        <p style="margin:0 0 4px;font-size:12px;color:#888;letter-spacing:2px;">DELIVERY ADDRESS</p>
        <p style="margin:0 0 24px;font-size:14px;color:#333;line-height:1.7;">
          ${form.address}, ${form.city}
          ${form.notes ? `<br><em style="color:#888;">${form.notes}</em>` : ""}
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #533113;margin-bottom:8px;">
          ${items
            .map(
              (i) => `
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#333;">
              ${i.name}${i.size ? ` (${i.size})` : ""}${i.color ? ` / ${i.color}` : ""} ×${i.quantity}
            </td>
            <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#333;text-align:right;white-space:nowrap;">
              GH₵${(i.price * i.quantity).toFixed(2)}
            </td>
          </tr>`
            )
            .join("")}
          <tr>
            <td style="padding:10px 0 4px;font-size:13px;color:#888;">Subtotal</td>
            <td style="padding:10px 0 4px;font-size:13px;color:#888;text-align:right;">GH₵${total.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;font-size:13px;color:#888;">${shippingMethod ?? "Delivery"}</td>
            <td style="padding:4px 0;font-size:13px;color:#888;text-align:right;">GH₵${deliveryFee.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0 0;font-size:17px;font-weight:bold;color:#533113;">Total</td>
            <td style="padding:10px 0 0;font-size:17px;font-weight:bold;color:#533113;text-align:right;">GH₵${grandTotal.toFixed(2)}</td>
          </tr>
        </table>

        <br>
        <a href="https://fitweargh.vercel.app/admin/orders" style="display:inline-block;background:#533113;color:#fff;text-decoration:none;padding:12px 28px;font-size:12px;letter-spacing:2px;">
          VIEW IN ADMIN PANEL
        </a>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}
