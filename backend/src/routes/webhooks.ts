import { Router } from 'express';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { sendOrderConfirmation } from '../services/email';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// ===================
// STRIPE WEBHOOK
// ===================
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutComplete(session);
      break;
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('Payment succeeded:', paymentIntent.id);
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailed(paymentIntent);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// ===================
// HANDLERS
// ===================

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    console.error('No order ID in session metadata');
    return;
  }

  try {
    // Update order status
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod: 'stripe',
        timeline: {
          create: {
            status: 'CONFIRMED',
            note: 'Payment received via Stripe',
          }
        }
      },
      include: {
        items: {
          include: {
            product: { include: { images: { take: 1 } } }
          }
        },
        shippingAddress: true,
      }
    });

    // Update inventory
    for (const item of order.items) {
      if (item.variantId) {
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: { quantity: { decrement: item.quantity } }
        });
      } else {
        await prisma.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } }
        });
      }
    }

    // Update discount code usage if applicable
    if (order.discountCodeId) {
      await prisma.discountCode.update({
        where: { id: order.discountCodeId },
        data: { usedCount: { increment: 1 } }
      });
    }

    // Clear user's cart
    if (order.userId) {
      await prisma.cartItem.deleteMany({
        where: { userId: order.userId }
      });
    }

    // Send confirmation email
    await sendOrderConfirmation(order);

    console.log(`Order ${order.orderNumber} confirmed`);
  } catch (error) {
    console.error('Error processing checkout completion:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Find order by payment intent if stored
  // Update order status to reflect failed payment
  console.error('Payment failed:', paymentIntent.id);
  
  // You could notify the customer or admin here
}

export default router;
