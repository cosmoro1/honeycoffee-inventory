import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    await pool.query(`
      ALTER TABLE activity_logs 
      ADD COLUMN edi_doc_type VARCHAR(20) NULL,
      ADD COLUMN raw_payload TEXT NULL;
    `);
    return NextResponse.json({ success: true, message: "Columns added successfully!" });
  } catch (error) {
    // If it says "Duplicate column name", that means it already worked!
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}