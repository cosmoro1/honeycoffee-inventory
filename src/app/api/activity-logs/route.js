import { NextResponse } from "next/server";
import pool from "@/lib/db";


export const dynamic = "force-dynamic"; 

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT
         id,
         type                                              AS title,
         message                                           AS description,
         DATE_FORMAT(created_at, '%h:%i %p')               AS time,
         status,
         edi_doc_type,
         raw_payload
       FROM activity_logs
       ORDER BY created_at DESC
       LIMIT 50`
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET /api/activity-logs]", err);
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { type, reference, message, status, edi_doc_type, raw_payload } = await request.json();
    
    if (!type || !message) {
      return NextResponse.json({ error: "type and message are required" }, { status: 400 });
    }
    
    await pool.query(
      "INSERT INTO activity_logs (type, reference, message, status, edi_doc_type, raw_payload) VALUES (?, ?, ?, ?, ?, ?)",
      [type, reference ?? null, message, status ?? "OK", edi_doc_type ?? null, raw_payload ?? null]
    );
    
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/activity-logs]", err);
    return NextResponse.json({ error: "Failed to insert log" }, { status: 500 });
  }
}