/**
 * Stripe Payment Integration
 * Handles checkout sessions, webhooks, and credit management
 */

import Stripe from 'stripe';
import { ENV } from './_core/env';
import * as db from './db';
import { getProductById, CREDIT_PACKAGES } from './products';

// Initialize Stripe
const stripe = new Stripe(ENV.stripeSecretKey, {
  apiVersion: '2025-10-29.clover',
});

/**
 * Create a Stripe Checkout Session for purchasing credits
 */
export async function createCheckoutSession(params: {
  userId: number;
  userEmail: string;
  userName: string;
  productId: string;
  origin: string;
}): Promise<{ sessionUrl: string }> {
  const { userId, userEmail, userName, productId, origin } = params;

  // Get product details
  const product = getProductById(productId);
  if (!product) {
    throw new Error(`Product ${productId} not found`);
  }

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: userEmail,
    client_reference_id: userId.toString(),
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: product.price,
          product_data: {
            name: product.name,
            description: product.description,
            images: [], // You can add product images here
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      user_id: userId.toString(),
      customer_email: userEmail,
      customer_name: userName,
      product_id: productId,
      credits: product.credits.toString(),
    },
    success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?canceled=true`,
    allow_promotion_codes: true,
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }

  // Record pending payment
  await db.createPayment({
    userId,
    stripeSessionId: session.id,
    amount: product.price,
    currency: 'usd',
    status: 'pending',
    productId,
    creditsGranted: product.credits,
    customerEmail: userEmail,
    customerName: userName,
    metadata: JSON.stringify({ product }),
  });

  return { sessionUrl: session.url };
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhookEvent(
  payload: Buffer,
  signature: string
): Promise<void> {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      ENV.stripeWebhookSecret
    );
  } catch (err: any) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = parseInt(session.metadata?.user_id || '0');
  const productId = session.metadata?.product_id;
  const credits = parseInt(session.metadata?.credits || '0');

  if (!userId || !productId || !credits) {
    console.error('Missing metadata in checkout session:', session.id);
    return;
  }

  // Update payment record
  await db.updatePaymentBySessionId(session.id, {
    status: 'completed',
    stripePaymentIntentId: session.payment_intent as string,
    completedAt: new Date(),
  });

  // Get current user quota
  const user = await db.getUserById(userId);
  if (!user) {
    console.error('User not found:', userId);
    return;
  }

  const balanceBefore = user.musicGenerationQuota;
  const balanceAfter = balanceBefore + credits;

  // Add credits to user
  await db.updateUserQuota(userId, balanceAfter);

  // Get payment record
  const payment = await db.getPaymentBySessionId(session.id);

  // Record credit transaction
  await db.createCreditTransaction({
    userId,
    amount: credits,
    type: 'purchase',
    description: `Purchased ${credits} credits - ${productId}`,
    paymentId: payment?.id,
    balanceBefore,
    balanceAfter,
  });

  console.log(`✅ Credits granted: ${credits} credits to user ${userId}`);
}

/**
 * Handle successful payment intent
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  console.log(`Payment succeeded: ${paymentIntent.id}`);
  // Additional logic if needed
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  console.log(`Payment failed: ${paymentIntent.id}`);
  
  // Update payment status if we can find it
  const payment = await db.getPaymentByPaymentIntentId(paymentIntent.id);
  if (payment) {
    await db.updatePayment(payment.id, {
      status: 'failed',
    });
  }
}

/**
 * Get Stripe instance (for other operations)
 */
export function getStripe(): Stripe {
  return stripe;
}
