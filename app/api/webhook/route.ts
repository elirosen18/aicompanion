import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";
import { stripe } from "@/lib/stripe";
import { Buffer } from "buffer";
import { NextApiRequest } from "next";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    //const body = await buffer(req);
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET as string);
  } catch (error: any) {
    // On error, log and return the error message
    console.log(`❌ Error message: ${error.message}`);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );
  console.log("completed");


    if (!session?.metadata?.userId) {
      return new NextResponse("User ID is Required.", { status: 400 });
    }

    await prismadb.userSubscription.create({
      data: {
        userId: session?.metadata?.userId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });
  }
if (event.type === "invoice.payment_succeeded") {
  console.log(session.subscription);
  console.log("payment succeeded");

    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    console.log("payment succeeded");

    await prismadb.userSubscription.update({
      where: {
        stripeSubscriptionId: subscription.id
      },
      data: {
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });
  }

  return new NextResponse(null, { status: 200 });
}
