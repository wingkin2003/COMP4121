import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

type CheckoutItem = {
  id: string;
  title: string;
  unitAmount: number;
  quantity: number;
};

type CheckoutRequestBody = {
  items?: CheckoutItem[];
  shippingAddress?: string;
};

const getStripeClient = (): Stripe => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  return new Stripe(secretKey);
};

const isValidItem = (item: CheckoutItem): boolean =>
  Boolean(item.id) &&
  Boolean(item.title?.trim()) &&
  Number.isInteger(item.unitAmount) &&
  item.unitAmount > 0 &&
  Number.isInteger(item.quantity) &&
  item.quantity > 0;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutRequestBody;
    const items = body.items ?? [];
    const shippingAddress = body.shippingAddress?.trim() ?? "";

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    if (items.some((item) => !isValidItem(item))) {
      return NextResponse.json(
        { error: "Invalid checkout items." },
        { status: 400 },
      );
    }

    if (!shippingAddress) {
      return NextResponse.json(
        { error: "Shipping address is required." },
        { status: 400 },
      );
    }

    const stripe = getStripeClient();
    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "hkd",
          unit_amount: item.unitAmount * 100,
          product_data: {
            name: item.title,
            metadata: {
              productId: item.id,
            },
          },
        },
      })),
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?cancelled=1`,
      metadata: {
        shippingAddress,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 500 },
      );
    }

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create Stripe checkout session.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
