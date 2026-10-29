const base = process.env.APP_URL;
const secret = process.env.AUTOMATION_SECRET;
if (!base || !secret || secret.length < 32) throw new Error("APP_URL and a separate AUTOMATION_SECRET of at least 32 characters are required.");
const response = await fetch(new URL("/api/automations/run", base), { method: "POST", headers: { authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(55_000) });
const body = await response.json().catch(() => ({}));
if (!response.ok) throw new Error(`Automation worker returned HTTP ${response.status}.`);
console.log(JSON.stringify(body));
