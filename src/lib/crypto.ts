import crypto from "crypto";

const KEY = Buffer.from(
  (process.env.NEXTAUTH_SECRET ?? "propedge-dev-secret-key-padded!!").padEnd(32).slice(0, 32)
);

const IV_LEN = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv("aes-256-cbc", KEY, iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + enc.toString("hex");
}

export function decrypt(encoded: string): string {
  const [ivHex, encHex] = encoded.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", KEY, iv);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}
