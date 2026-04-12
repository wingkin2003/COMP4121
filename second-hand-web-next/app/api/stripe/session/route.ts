import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const getStripeClient = (): Stripe => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  return new Stripe(secretKey);
};

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id." }, { status: 400 });
  }

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      paid: session.payment_status === "paid",
      paymentStatus: session.payment_status,
      shippingAddress: session.metadata?.shippingAddress ?? "",
      amountTotal: session.amount_total ?? 0,
      currency: session.currency ?? "hkd",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to verify Stripe session.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
