export function adminInviteEmailHtml(name: string, email: string, password: string): string {
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
        <p style="margin:0 0 24px;color:#533113;font-size:15px;line-height:1.8;">
          You've been invited to manage the FitwearGH admin panel. Use the credentials below to sign in.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF6;border:1px solid #DEDEDE;margin-bottom:28px;">
          <tr>
            <td style="padding:14px 20px;border-bottom:1px solid #DEDEDE;">
              <p style="margin:0 0 4px;color:#533113;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Email</p>
              <p style="margin:0;color:#533113;font-size:15px;">${email}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 20px;">
              <p style="margin:0 0 4px;color:#533113;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Temporary Password</p>
              <p style="margin:0;color:#533113;font-size:18px;letter-spacing:3px;font-weight:bold;">${password}</p>
            </td>
          </tr>
        </table>

        <a href="https://fitweargh.vercel.app/admin/login" style="display:inline-block;background:#533113;color:#ffffff;text-decoration:none;padding:14px 32px;font-size:12px;letter-spacing:3px;">
          GO TO ADMIN PANEL
        </a>

        <p style="margin:28px 0 0;color:#533113;font-size:13px;line-height:1.7;opacity:0.6;">
          Please change your password after your first login. Keep these credentials secure and do not share them.
        </p>
      </td></tr>

      <tr><td style="padding:20px 40px;border-top:1px solid #DEDEDE;text-align:center;">
        <p style="margin:0;color:#533113;font-size:12px;opacity:0.5;">FitwearGH Admin · If you did not expect this email, please ignore it.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}
