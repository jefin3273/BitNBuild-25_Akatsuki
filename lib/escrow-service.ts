import { supabase } from './supabaseClient';
import { stripe } from './stripe';

export interface EscrowPayment {
    id: number;
    project_id: number;
    client_id: number;
    freelancer_id: number;
    amount: number;
    currency: string;
    stripe_payment_intent_id?: string;
    status: 'pending' | 'held' | 'released' | 'refunded' | 'disputed';
    created_at: string;
    updated_at: string;
    released_at?: string;
    dispute_reason?: string;
    notes?: string;
}

export class EscrowService {
    // Create escrow payment when bid is accepted
    static async createEscrowPayment(data: {
        projectId: number;
        clientId: number;
        freelancerId: number;
        amount: number;
        currency?: string;
    }) {
        try {
            console.log('Creating escrow payment with data:', data);

            // Create payment intent with Stripe (money is held, not charged)
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(data.amount * 100), // Convert to cents
                currency: data.currency || 'usd',
                capture_method: 'manual', // This holds the payment
                automatic_payment_methods: {
                    enabled: true,
                    allow_redirects: 'never', // Prevents redirect-based payment methods
                },
                metadata: {
                    project_id: data.projectId.toString(),
                    client_id: data.clientId.toString(),
                    freelancer_id: data.freelancerId.toString(),
                    type: 'escrow_payment',
                },
            });

            console.log('Stripe payment intent created:', paymentIntent.id);

            // Store in database
            const { data: escrowPayment, error } = await (supabase as any)
                .from('escrow_payments')
                .insert({
                    project_id: data.projectId,
                    client_id: data.clientId,
                    freelancer_id: data.freelancerId,
                    amount: data.amount,
                    currency: data.currency || 'USD',
                    stripe_payment_intent_id: paymentIntent.id,
                    status: 'pending',
                })
                .select()
                .single();

            if (error) {
                console.error('Database error:', error);
                throw error;
            }

            console.log('Escrow payment created in database:', escrowPayment);

            return {
                escrowPayment,
                clientSecret: paymentIntent.client_secret,
            };
        } catch (error) {
            console.error('Error creating escrow payment:', error);
            throw error;
        }
    }

    // Confirm payment (moves from pending to held)
    static async confirmPayment(escrowPaymentId: number, paymentIntentId: string) {
        try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

            if (paymentIntent.status === 'requires_capture') {
                // Update status to held
                const { data, error } = await (supabase as any)
                    .from('escrow_payments')
                    .update({
                        status: 'held',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', escrowPaymentId)
                    .select()
                    .single();

                if (error) throw error;
                return data;
            }

            throw new Error(`PaymentIntent not ready to hold. Current status: ${paymentIntent.status}`);
        } catch (error) {
            console.error('Error confirming payment:', error);
            throw error;
        }
    }


    // Release payment to freelancer
    static async releasePayment(escrowPaymentId: number, clientId: number) {
        try {
            // Get escrow payment
            const { data: escrowPayment, error: fetchError } = await (supabase as any)
                .from('escrow_payments')
                .select('*')
                .eq('id', escrowPaymentId)
                .eq('client_id', clientId) // Ensure only client can release
                .single();

            if (fetchError || !escrowPayment) {
                throw new Error('Escrow payment not found or unauthorized');
            }

            if (escrowPayment.status !== 'held') {
                throw new Error('Payment is not in held status');
            }

            // Capture the payment with Stripe
            await stripe.paymentIntents.capture(escrowPayment.stripe_payment_intent_id);

            // Update status to released
            const { data, error } = await (supabase as any)
                .from('escrow_payments')
                .update({
                    status: 'released',
                    released_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', escrowPaymentId)
                .select()
                .single();

            if (error) throw error;

            // Update project status
            await (supabase as any)
                .from('projects')
                .update({ status: 'approved' })
                .eq('id', escrowPayment.project_id);

            return data;
        } catch (error) {
            console.error('Error releasing payment:', error);
            throw error;
        }
    }

    // Refund payment (for disputes or cancellations)
    static async refundPayment(escrowPaymentId: number, reason?: string) {
        try {
            const { data: escrowPayment, error: fetchError } = await (supabase as any)
                .from('escrow_payments')
                .select('*')
                .eq('id', escrowPaymentId)
                .single();

            if (fetchError || !escrowPayment) {
                throw new Error('Escrow payment not found');
            }

            if (!['held', 'disputed'].includes(escrowPayment.status)) {
                throw new Error('Payment cannot be refunded from current status');
            }

            // Cancel the payment intent (refunds the money)
            await stripe.paymentIntents.cancel(escrowPayment.stripe_payment_intent_id);

            // Update status
            const { data, error } = await (supabase as any)
                .from('escrow_payments')
                .update({
                    status: 'refunded',
                    dispute_reason: reason,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', escrowPaymentId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error refunding payment:', error);
            throw error;
        }
    }

    // Get escrow payment by project ID
    static async getEscrowByProjectId(projectId: string): Promise<EscrowPayment | null> {
        const { data, error } = await (supabase as any)
            .from('escrow_payments')
            .select('*')
            .eq('project_id', projectId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching escrow payment:', error);
            return null;
        }

        return data;
    }
}