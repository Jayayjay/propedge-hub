const ACCOUNT_SID  = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN   = process.env.TWILIO_AUTH_TOKEN;
const FROM         = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";
const CONTENT_SID  = process.env.TWILIO_CONTENT_SID;

export async function sendWhatsAppAlert(
  to: string,
  title: string,
  message: string,
  severity: "info" | "warning" | "critical",
  firm: string,
) {
  if (!ACCOUNT_SID || !AUTH_TOKEN) return;

  const recipient = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

  const params = new URLSearchParams({ From: FROM, To: recipient });

  if (CONTENT_SID) {
    const emoji = severity === "critical" ? "🚨" : severity === "warning" ? "⚠️" : "✅";
    params.set("ContentSid", CONTENT_SID);
    params.set(
      "ContentVariables",
      JSON.stringify({ "1": `${emoji} ${title}`, "2": `${message} — ${firm}` }),
    );
  } else {
    const emoji = severity === "critical" ? "🚨" : severity === "warning" ? "⚠️" : "✅";
    params.set("Body", `${emoji} *PropEdge Hub Alert*\n*${title}*\n\n${message}\n\nFirm: ${firm}`);
  }

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      },
    );
    if (!res.ok) {
      const err = await res.text();
      console.error("[whatsapp] Send failed:", err);
    }
  } catch (err) {
    console.error("[whatsapp] Request error:", err);
  }
}
