import mysql from "mysql2/promise";
if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL is required.");
const connection=await mysql.createConnection(process.env.DATABASE_URL);
try{const[[summary]]=await connection.execute(`SELECT COUNT(*) designs, SUM(fixed_colour_id IS NOT NULL) fixed_colours,
SUM(name_el IS NOT NULL AND description_el IS NOT NULL AND description_en IS NOT NULL AND details_el IS NOT NULL AND details_en IS NOT NULL) complete_profiles FROM designs WHERE active=true`);
const[conflicts]=await connection.execute(`SELECT v.design_id,COUNT(DISTINCT v.colour_id) colours FROM product_variants v WHERE v.active=true GROUP BY v.design_id HAVING COUNT(DISTINCT v.colour_id)>1`);
const result={designs:Number(summary.designs),fixedColours:Number(summary.fixed_colours),completeProfiles:Number(summary.complete_profiles),multiColourConflicts:conflicts.length};console.log(JSON.stringify(result,null,2));if(result.designs!==15||result.fixedColours!==15||result.completeProfiles!==15||result.multiColourConflicts!==0)throw new Error("Design catalogue is incomplete or has active colour conflicts.");}finally{await connection.end();}
