export function welcomeEmailHtml(name: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FFFBF6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF6;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #DEDEDE;">

      <tr><td style="background:#533113;padding:28px 40px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:6px;font-weight:normal;">FITWEARGH</h1>
      </td></tr>

      <tr><td style="padding:36px 40px;">
        <p style="margin:0 0 12px;color:#533113;font-size:20px;">Hi ${name},</p>
        <p style="margin:0 0 16px;color:#533113;font-size:15px;line-height:1.8;">
          Welcome to FitwearGH — your go-to destination for premium sportswear and fashion in Ghana.
        </p>
        <p style="margin:0 0 28px;color:#533113;font-size:15px;line-height:1.8;">
          Explore our latest collections and get fast delivery right to your doorstep.
        </p>
        <a href="https://fitweargh.vercel.app/new-arrivals" style="display:inline-block;background:#533113;color:#ffffff;text-decoration:none;padding:14px 32px;font-size:12px;letter-spacing:3px;">
          SHOP NEW ARRIVALS
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
