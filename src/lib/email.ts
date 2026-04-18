import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM ?? "PropEdge Hub <junkyardtechstore@gmail.com>";

function baseLayout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000000;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#0D0D0D;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:28px 32px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#ffffff;border-radius:8px;width:32px;height:32px;text-align:center;vertical-align:middle;">
                    <span style="color:#000;font-size:16px;font-weight:900;line-height:32px;">↗</span>
                  </td>
                  <td style="padding-left:10px;">
                    <span style="color:#ffffff;font-size:17px;font-weight:800;letter-spacing:-0.5px;">PropEdge<span style="color:rgba(255,255,255,0.4);">Hub</span></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
              <p style="margin:0;color:#333;font-size:12px;">
                PropEdge Hub · Never blow another prop challenge
              </p>
              <p style="margin:6px 0 0;color:#272727;font-size:11px;">
                You're receiving this because you have an account with us.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function send(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err);
  }
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(to)}`;

  const html = baseLayout(
    "Verify your email",
    `<h1 style="margin:0 0 8px;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Verify your email</h1>
     <p style="margin:0 0 28px;color:#555;font-size:14px;line-height:1.7;">
       Hi ${name}, click the button below to activate your PropEdge Hub account. This link expires in <strong style="color:#888;">24 hours</strong>.
     </p>

     <a href="${verifyUrl}"
        style="display:inline-block;background:#ffffff;color:#000000;font-size:14px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:-0.2px;">
       Verify Email Address →
     </a>

     <p style="margin:28px 0 0;color:#333;font-size:12px;line-height:1.7;">
       Or copy this link into your browser:<br/>
       <span style="color:#3a3a3a;word-break:break-all;">${verifyUrl}</span>
     </p>

     <p style="margin:20px 0 0;color:#2a2a2a;font-size:12px;">
       If you didn't create an account, you can safely ignore this email.
     </p>`
  );

  await send(to, "Verify your PropEdge Hub email", html);
}

export async function sendWelcomeEmail(to: string, name: string) {
  const html = baseLayout(
    "Welcome to PropEdge Hub",
    `<h1 style="margin:0 0 8px;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Welcome, ${name}</h1>
     <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.7;">
       Your PropEdge Hub account is ready. Start tracking your prop firm challenges and never breach a rule accidentally.
     </p>

     <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
       ${[
         ["Track unlimited challenges", "Monitor every phase in real time."],
         ["Live MT5 sync", "Connect your MetaTrader 5 account for live data."],
         ["Smart alerts", "Get notified before you hit drawdown limits."],
       ].map(([title, desc]) => `
       <tr>
         <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
           <span style="color:rgba(255,255,255,0.3);font-size:14px;margin-right:10px;">—</span>
           <strong style="color:#cccccc;font-size:14px;">${title}</strong>
           <span style="color:#444;font-size:13px;"> · ${desc}</span>
         </td>
       </tr>`).join("")}
     </table>

     <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/dashboard"
        style="display:inline-block;background:#ffffff;color:#000000;font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;text-decoration:none;letter-spacing:-0.2px;">
       Go to Dashboard →
     </a>`
  );

  await send(to, "Welcome to PropEdge Hub", html);
}

export async function sendAlertEmail(
  to: string,
  alertTitle: string,
  alertMessage: string,
  severity: "info" | "warning" | "critical",
  firm: string,
) {
  const colors: Record<string, string> = {
    info: "#ffffff",
    warning: "#F59E0B",
    critical: "#EF4444",
  };
  const labels: Record<string, string> = {
    info: "Info",
    warning: "Warning",
    critical: "Critical",
  };
  const color = colors[severity] ?? "#F59E0B";
  const label = labels[severity] ?? severity;
  const isCritical = severity === "critical";

  const html = baseLayout(
    alertTitle,
    `<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-left:3px solid ${color};border-radius:8px;padding:16px 20px;margin-bottom:24px;">
       <p style="margin:0 0 4px;color:${color};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">${label}</p>
       <p style="margin:0;color:#ffffff;font-size:16px;font-weight:700;">${alertTitle}</p>
     </div>

     <p style="margin:0 0 20px;color:#555;font-size:14px;line-height:1.7;">${alertMessage}</p>

     <p style="margin:0 0 24px;color:#333;font-size:13px;">
       Firm: <strong style="color:#555;">${firm}</strong>
     </p>

     <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/dashboard"
        style="display:inline-block;background:${isCritical ? color : "#ffffff"};color:${isCritical ? "#ffffff" : "#000000"};font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;text-decoration:none;letter-spacing:-0.2px;">
       View Dashboard →
     </a>`
  );

  await send(to, `PropEdge Alert: ${alertTitle}`, html);
}

export async function sendSubscriptionEmail(
  to: string,
  name: string,
  plan: string,
) {
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const prices: Record<string, string> = { pro: "$10/mo", elite: "$17/mo" };
  const price = prices[plan] ?? "";

  const html = baseLayout(
    `${planLabel} Plan Activated`,
    `<h1 style="margin:0 0 8px;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">${planLabel} plan activated</h1>
     <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.7;">
       Hi ${name}, your <strong style="color:#ccc;">${planLabel}</strong> subscription${price ? ` (${price})` : ""} is now active. All premium features are unlocked.
     </p>

     <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:20px;margin-bottom:28px;">
       <p style="margin:0 0 14px;color:#888;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Unlocked Features</p>
       ${(plan === "elite"
         ? ["Everything in Pro", "MT5 trade copier", "API access", "Dedicated account manager", "Custom firm rules"]
         : ["Unlimited challenges", "Live MT5 sync", "WhatsApp + Email alerts", "PDF report exports", "Priority support"]
       ).map((f) => `
       <p style="margin:0 0 8px;color:#555;font-size:13px;">
         <span style="color:rgba(255,255,255,0.2);margin-right:10px;">—</span>${f}
       </p>`).join("")}
     </div>

     <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/dashboard"
        style="display:inline-block;background:#ffffff;color:#000000;font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;text-decoration:none;letter-spacing:-0.2px;">
       Go to Dashboard →
     </a>`
  );

  await send(to, `Your ${planLabel} plan is active — PropEdge Hub`, html);
}
