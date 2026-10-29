"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { returnRequestInput } from "@/features/returns/workflow";
import { databasePool } from "@/lib/db/connection";

export async function requestReturn(formData: FormData) {
  const publicId=z.string().uuid().parse(formData.get("publicId"));
  const input=returnRequestInput.parse(Object.fromEntries(formData));
  const connection=await databasePool.getConnection();
  try{await connection.beginTransaction();const [rows]=await connection.execute("SELECT id,email,order_number,payment_status,fulfilment_status FROM orders WHERE public_id=? LIMIT 1 FOR UPDATE",[publicId]);const order=(rows as Array<{id:number;email:string;order_number:string;payment_status:string;fulfilment_status:string}>)[0];if(!order||order.email.trim().toLowerCase()!==input.email.toLowerCase())throw new Error("Order details could not be verified.");if(order.payment_status!=="paid"||!["shipped","delivered","returned"].includes(order.fulfilment_status))throw new Error("This order is not ready for return review.");const requestPublicId=randomUUID();const [result]=await connection.execute("INSERT IGNORE INTO return_requests (public_id,order_id,reason,customer_note) VALUES (?,?,?,?)",[requestPublicId,order.id,input.reason,input.customerNote]);if(Number((result as {affectedRows:number}).affectedRows)===1){const recipient=process.env.ADMIN_ORDER_EMAIL?.trim()||process.env.CONTACT_STUDIO_EMAIL?.trim();if(recipient)await connection.execute("INSERT IGNORE INTO email_deliveries (order_id,template,recipient,idempotency_key,context) VALUES (?,'admin_return_request',?,?,?)",[order.id,recipient,`return-request-admin:${requestPublicId}`,JSON.stringify({requestPublicId,reason:input.reason})]);}await connection.commit();}catch(error){await connection.rollback();throw error;}finally{connection.release();}
  revalidatePath(`/order/${publicId}`);redirect(`/order/${publicId}?return=requested`);
}
