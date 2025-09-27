import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient'; // your Supabase client

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY!, {
    apiVersion: '2025-08-27.basil',
});

// Disable Next.js body parsing to verify Stripe signature
export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(request: NextRequest) {
    const sig = request.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    try {
        const rawBody = await request.text(); // raw body required for signature check
        event = stripe.webhooks.constructEvent(rawBody, sig!, webhookSecret);
    } catch (err: any) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const pi = event.data.object as Stripe.PaymentIntent;

                // Update status to released if already captured
                const { error } = await supabase
                    .from('escrow_payments')
                    .update({ status: 'released', updated_at: new Date().toISOString() })
                    .eq('stripe_payment_intent_id', pi.id);

                if (error) console.error('Supabase update error:', error);
                console.log(`✅ PaymentIntent ${pi.id} succeeded`);
                break;
            }

            case 'payment_intent.payment_failed': {
                const pi = event.data.object as Stripe.PaymentIntent;

                const { error } = await supabase
                    .from('escrow_payments')
                    .update({ status: 'failed', updated_at: new Date().toISOString() })
                    .eq('stripe_payment_intent_id', pi.id);

                if (error) console.error('Supabase update error:', error);
                console.log(`❌ PaymentIntent ${pi.id} failed`);
                break;
            }

            case 'payment_intent.canceled': {
                const pi = event.data.object as Stripe.PaymentIntent;

                const { error } = await supabase
                    .from('escrow_payments')
                    .update({ status: 'canceled', updated_at: new Date().toISOString() })
                    .eq('stripe_payment_intent_id', pi.id);

                if (error) console.error('Supabase update error:', error);
                console.log(`⚠️ PaymentIntent ${pi.id} canceled`);
                break;
            }

            default:
                console.log(`ℹ️ Unhandled event type: ${event.type}`);
        }
    } catch (err: any) {
        console.error('❌ Webhook handling failed:', err.message);
        return new NextResponse(`Webhook Handler Error: ${err.message}`, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
