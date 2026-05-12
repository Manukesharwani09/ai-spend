import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Basic in-memory rate limiting (Note: in a serverless environment, this resets per lambda cold start, 
// but provides basic protection against rapid-fire bursts)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now - record.lastReset > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  record.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    // Basic IP extraction for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests, please try again later." }, { status: 429 });
    }

    const body = await request.json();
    const { email, companyName, role, teamSize, website_url, auditData } = body;

    // Honeypot check: If the hidden 'website_url' field is filled out, silently accept but ignore it
    if (website_url) {
      console.log("Honeypot triggered");
      return NextResponse.json({ success: true });
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    // Initialize clients
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendKey = process.env.RESEND_API_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Store in Supabase
      const { error: dbError } = await supabase
        .from('leads')
        .insert([
          {
            email,
            company_name: companyName,
            role,
            team_size: teamSize,
            audit_data: auditData,
          }
        ]);
        
      if (dbError) {
        console.error("Supabase insert error:", dbError);
        // Continue even if DB fails, maybe we can still send the email
      }
    } else {
      console.warn("Supabase credentials missing. Lead not saved to DB.");
    }

    // Send email via Resend
    if (resendKey) {
      const resend = new Resend(resendKey);
      
      const isHighSavings = auditData?.summary?.credexRecommended;
      let emailText = `Hello,\n\nThanks for using SignalSpend to audit your AI tools!\n\n`;
      emailText += `Your current total spend is $${auditData?.summary?.totalMonthlyUsd || 0}/mo. `;
      emailText += `We identified potential savings of $${auditData?.summary?.totalSavingsMonthlyUsd || 0}/mo.\n\n`;
      
      if (isHighSavings) {
        emailText += `Since you have significant potential savings, the Credex team will review your stack and reach out directly with custom inventory options.\n\n`;
      } else {
        emailText += `Review your full report online anytime to implement the recommended plan changes.\n\n`;
      }
      emailText += `Best,\nThe Credex Team`;

      const { error: emailError } = await resend.emails.send({
        from: "Credex <hello@yourdomain.com>", // Replace with your verified Resend domain
        to: email,
        subject: "Your SignalSpend Audit Results",
        text: emailText,
      });

      if (emailError) {
        console.error("Resend error:", emailError);
      }
    } else {
      console.warn("Resend API key missing. Email not sent.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lead API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
