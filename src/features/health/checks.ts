import "server-only";
import { databasePool } from "@/lib/db/connection";

export type HealthCheck = { name:string; ok:boolean; detail:string };
export async function applicationHealth() {
  const checks:HealthCheck[]=[];
  try{await databasePool.execute("SELECT 1");checks.push({name:"database",ok:true,detail:"MySQL connection available"});}catch{checks.push({name:"database",ok:false,detail:"MySQL connection unavailable"});}
  const smtp=Boolean(process.env.SMTP_HOST&&process.env.SMTP_USER&&process.env.SMTP_PASSWORD&&process.env.MAIL_FROM);checks.push({name:"email",ok:smtp,detail:smtp?"Authenticated SMTP configured":"SMTP configuration incomplete"});
  const fakeEnabled=process.env.ENABLE_FAKE_PAYMENTS==="true";const provider=process.env.PAYMENTS_DEFAULT_PROVIDER??"fake";const paymentSafe=process.env.NODE_ENV!=="production"||(!fakeEnabled&&provider!=="fake");checks.push({name:"payments",ok:paymentSafe,detail:paymentSafe?`Provider mode: ${provider}`:"Fake payments cannot be the production provider"});
  const appUrl=process.env.APP_URL??"";const urlSafe=process.env.NODE_ENV!=="production"||appUrl.startsWith("https://");checks.push({name:"canonical_url",ok:urlSafe,detail:urlSafe?`Configured origin: ${appUrl||"development"}`:"Production APP_URL must use HTTPS"});
  try{const[rows]=await databasePool.execute("SELECT COALESCE(SUM(blocked_count),0) blocked FROM commerce_rate_limits WHERE window_started_at>DATE_SUB(NOW(),INTERVAL 15 MINUTE)");const blocked=Number((rows as Array<{blocked:number}>)[0]?.blocked??0);checks.push({name:"commerce_abuse_controls",ok:true,detail:`Active; ${blocked} blocked attempts in the last 15 minutes`});}catch{checks.push({name:"commerce_abuse_controls",ok:false,detail:"Commerce abuse-control migration is unavailable"});}
  return {ok:checks.every(check=>check.ok),checks,checkedAt:new Date().toISOString()};
}
