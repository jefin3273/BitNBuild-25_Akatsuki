'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
    projectId: number;
    clientId: number;
    freelancerId: number;
    amount: number;
    onPaymentSuccess: (escrowPaymentId: number) => void;
    onPaymentError: (error: string) => void;
}

function PaymentForm({
    projectId,
    clientId,
    freelancerId,
    amount,
    onPaymentSuccess,
    onPaymentError
}: PaymentFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [clientSecret, setClientSecret] = useState<string>('');
    const [escrowPaymentId, setEscrowPaymentId] = useState<number>(0);

    // Create payment intent when component mounts
    useEffect(() => {
        createEscrowPayment();
    }, []);

    const createEscrowPayment = async () => {
        try {
            const response = await fetch('/api/escrow/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    clientId,
                    freelancerId,
                    amount,
                }),
            });

            const data = await response.json();

            if (data.clientSecret) {
                setClientSecret(data.clientSecret);
                setEscrowPaymentId(data.escrowPayment.id);
            } else {
                onPaymentError('Failed to create payment');
            }
        } catch (error) {
            onPaymentError('Failed to initialize payment');
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements || !clientSecret) return;

        setLoading(true);

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) return;

        // Confirm payment with Stripe
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
            }
        });

        if (error) {
            onPaymentError(error.message || 'Payment failed');
            setLoading(false);
            return;
        }

        // Confirm payment in our system
        try {
            await fetch('/api/escrow/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    escrowPaymentId,
                    paymentIntentId: paymentIntent.id,
                }),
            });

            onPaymentSuccess(escrowPaymentId);
        } catch (error) {
            onPaymentError('Failed to confirm payment');
        }

        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 border rounded">
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#424770',
                                '::placeholder': {
                                    color: '#aab7c4',
                                },
                            },
                        },
                    }}
                />
            </div>

            <button
                type="submit"
                disabled={!stripe || loading}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded disabled:opacity-50"
            >
                {loading ? 'Processing...' : `Pay $${amount} to Escrow`}
            </button>
        </form>
    );
}

export function EscrowPayment(props: PaymentFormProps) {
    return (
        <Elements stripe={stripePromise}>
            <PaymentForm {...props} />
        </Elements>
    );
}