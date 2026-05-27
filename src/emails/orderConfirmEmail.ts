export interface OrderEmailData {
  orderId: string;
  form: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    notes: string;
  };
  items: {
    name: string;
    size: string;
    color: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  deliveryFee: number;
  grandTotal: number;
  shippingMethod?: string;
}

function itemRowsHtml(items: OrderEmailData["items"]): string {
  return items
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #DEDEDE;color:#533113;font-size:14px;">
        ${item.name}${item.size ? ` — ${item.size}` : ""}${item.color ? ` / ${item.color}` : ""}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #DEDEDE;color:#533113;font-size:14px;text-align:center;">
        ×${item.quantity}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #DEDEDE;color:#533113;font-size:14px;text-align:right;">
        GH₵${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>`
    )
    .join("");
}

export function orderConfirmHtml({ orderId, form, items, total, deliveryFee, grandTotal, shippingMethod }: OrderEmailData): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FFFBF6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF6;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #DEDEDE;">

      <tr><td style="background:#533113;padding:28px 40px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:6px;font-weight:normal;">FITWEARGH</h1>
      </td></tr>

      <tr><td style="padding:36px 40px 24px;">
        <p style="margin:0 0 8px;color:#533113;font-size:20px;">Order Confirmed!</p>
        <p style="margin:0 0 4px;color:#533113;font-size:14px;">Hi ${form.name},</p>
        <p style="margin:0 0 24px;color:#533113;font-size:14px;line-height:1.8;opacity:0.8;">
          Thank you for your order. We have received it and will contact you shortly on
          <strong>${form.phone}</strong> to arrange delivery.
        </p>

        <p style="margin:0 0 8px;color:#533113;font-size:11px;letter-spacing:2px;opacity:0.5;">ORDER REFERENCE</p>
        <p style="margin:0 0 24px;color:#533113;font-size:15px;font-weight:bold;">#${orderId.slice(0, 8).toUpperCase()}</p>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
          <thead>
            <tr>
              <th style="text-align:left;color:#533113;font-size:11px;letter-spacing:2px;padding-bottom:8px;border-bottom:2px solid #533113;opacity:0.6;">ITEM</th>
              <th style="text-align:center;color:#533113;font-size:11px;letter-spacing:2px;padding-bottom:8px;border-bottom:2px solid #533113;opacity:0.6;">QTY</th>
              <th style="text-align:right;color:#533113;font-size:11px;letter-spacing:2px;padding-bottom:8px;border-bottom:2px solid #533113;opacity:0.6;">PRICE</th>
            </tr>
          </thead>
          <tbody>${itemRowsHtml(items)}</tbody>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td style="color:#533113;font-size:14px;padding:4px 0;opacity:0.7;">Subtotal</td>
            <td style="text-align:right;color:#533113;font-size:14px;padding:4px 0;opacity:0.7;">GH₵${total.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="color:#533113;font-size:14px;padding:4px 0;opacity:0.7;">${shippingMethod ?? "Delivery"}</td>
            <td style="text-align:right;color:#533113;font-size:14px;padding:4px 0;opacity:0.7;">GH₵${deliveryFee.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="color:#533113;font-size:16px;padding:10px 0 0;font-weight:bold;">Total</td>
            <td style="text-align:right;color:#533113;font-size:16px;padding:10px 0 0;font-weight:bold;">GH₵${grandTotal.toFixed(2)}</td>
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF6;border:1px solid #DEDEDE;">
          <tr><td style="padding:16px 20px;">
            <p style="margin:0 0 4px;color:#533113;font-size:11px;letter-spacing:2px;opacity:0.5;">DELIVERY TO</p>
            <p style="margin:0;color:#533113;font-size:14px;line-height:1.7;">${form.address}, ${form.city}</p>
            ${form.notes ? `<p style="margin:6px 0 0;color:#533113;font-size:13px;opacity:0.6;">Note: ${form.notes}</p>` : ""}
          </td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:20px 40px;border-top:1px solid #DEDEDE;text-align:center;">
        <p style="margin:0;color:#533113;font-size:12px;opacity:0.5;">FitwearGH, Ghana. Questions? Reply to this email.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}
