import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase credentials missing. Share snapshot failed.");
      return NextResponse.json(
        { error: "Database not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { payload, audit, aiSummary } = body;

    if (!payload || !audit) {
      return NextResponse.json(
        { error: "Missing required snapshot data." },
        { status: 400 }
      );
    }

    // Generate a short unique ID for the report
    const shortId = "rpt_" + crypto.randomBytes(4).toString("hex");

    const supabase = createClient(supabaseUrl, supabaseKey);

    const snapshot = {
      id: shortId,
      payload,
      audit,
      aiSummary: aiSummary || null,
      createdAt: new Date().toISOString(),
    };

    const { error: dbError } = await supabase
      .from("public_reports")
      .insert([
        {
          report_id: shortId,
          public_report_json: snapshot,
        },
      ]);

    if (dbError) {
      console.error("Failed to insert public report:", dbError);
      return NextResponse.json(
        { error: "Failed to save report snapshot." },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: shortId });
  } catch (error) {
    console.error("Share endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
