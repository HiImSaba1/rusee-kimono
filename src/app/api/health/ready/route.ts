import { NextResponse } from "next/server";
import { applicationHealth } from "@/features/health/checks";
export const dynamic="force-dynamic";
export async function GET(){const health=await applicationHealth();return NextResponse.json({status:health.ok?"ready":"not_ready"},{status:health.ok?200:503,headers:{"Cache-Control":"no-store"}});}
