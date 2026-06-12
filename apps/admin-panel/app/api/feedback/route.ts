import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabaseServer";
import { requestAddress, takeRateLimit } from "@/lib/rateLimit";

const feedbackSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  restaurantCode: z.string().trim().max(40).optional().default(""),
  category: z.enum(["support", "activation", "backup", "printing", "feedback"]),
  message: z.string().trim().min(10).max(3000),
});

export async function POST(request: Request) {
  try {
    const address = requestAddress(request);
    if (!takeRateLimit(`feedback:${address}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }
    const form = await request.formData();
    const parsed = feedbackSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid feedback." }, { status: 400 });
    }
    const ticketNumber = `RZ-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const result = await createSupabaseAdminClient().from("support_tickets").insert({
      ticket_number: ticketNumber,
      requester_name: parsed.data.name,
      requester_email: parsed.data.email,
      restaurant_code: parsed.data.restaurantCode.toUpperCase(),
      category: parsed.data.category,
      message: parsed.data.message,
      source_ip: address === "unknown" ? null : address,
    });
    if (result.error) {
      const missingSchema = /does not exist|schema cache|could not find the table/i.test(result.error.message);
      return NextResponse.json({
        error: missingSchema
          ? "Support is being configured. Please retry after the database migration is applied."
          : "Support service is temporarily unavailable. Please retry.",
      }, { status: 503 });
    }
    return NextResponse.json({ ok: true, ticketNumber }, { status: 201 });
  } catch (error) {
    console.error("Feedback submission failed", error);
    return NextResponse.json({
      error: "Cannot reach the support service. Check your connection and retry.",
    }, { status: 503 });
  }
}
