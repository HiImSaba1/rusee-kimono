import mysql from "mysql2/promise";

const appUrl=(process.env.APP_URL??"").replace(/\/$/,"");
const webhook=process.env.ALERT_WEBHOOK_URL;
const cooldown=Math.max(5,Number(process.env.MONITOR_ALERT_COOLDOWN_MINUTES??30));
if(!appUrl)throw new Error("APP_URL is required for health monitoring.");

let response;
try{response=await fetch(`${appUrl}/api/health/ready`,{headers:{"user-agent":"rusee-cpanel-monitor/1.0"},signal:AbortSignal.timeout(10000)});}catch{response=null;}
if(response?.ok){console.log(JSON.stringify({status:"ready",checkedAt:new Date().toISOString()}));process.exit(0);}

const status="not_ready";const checkedAt=new Date().toISOString();
if(!webhook){console.error(JSON.stringify({status,checkedAt,alert:"not_configured"}));process.exitCode=1;}
else{
  if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL is required for alert cooldown tracking.");
  const connection=await mysql.createConnection(process.env.DATABASE_URL);
  try{
    const[rows]=await connection.execute("SELECT created_at FROM admin_audit_events WHERE action='system.health_alert' ORDER BY created_at DESC LIMIT 1");
    const last=rows[0]?.created_at?new Date(rows[0].created_at).getTime():0;
    if(Date.now()-last<cooldown*60_000)console.error(JSON.stringify({status,checkedAt,alert:"cooldown"}));
    else{const alertResponse=await fetch(webhook,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({application:"rusee-shop",status,origin:appUrl,checkedAt}),signal:AbortSignal.timeout(10000)});if(!alertResponse.ok)throw new Error(`Alert webhook returned ${alertResponse.status}.`);await connection.execute("INSERT INTO admin_audit_events (action,entity_type,metadata) VALUES ('system.health_alert','application',?)",[JSON.stringify({status,origin:appUrl})]);console.error(JSON.stringify({status,checkedAt,alert:"sent"}));}
  }finally{await connection.end();}
  process.exitCode=1;
}
