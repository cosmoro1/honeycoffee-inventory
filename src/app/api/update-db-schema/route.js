import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    await pool.query(`
      ALTER TABLE activity_logs 
      ADD COLUMN edi_doc_type VARCHAR(20) NULL,
      ADD COLUMN raw_payload TEXT NULL;
    `);
    
    return NextResponse.json({ 
      success: true, 
      message: "Columns added perfectly!" 
    });
  } catch (error) {
    // UPDATED: Logging out to terminal and extracting complete properties
    console.error("SCHEMA ERROR DETECTED:", error);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message || String(error) || "Unknown query exception" 
    });
  }
}