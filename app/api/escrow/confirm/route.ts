import { NextRequest, NextResponse } from 'next/server';
import { EscrowService } from '@/lib/escrow-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { escrowPaymentId, paymentIntentId } = body;

        const result = await EscrowService.confirmPayment(escrowPaymentId, paymentIntentId);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Payment confirmation error:', error);
        return NextResponse.json(
            { error: 'Failed to confirm payment' },
            { status: 500 }
        );
    }
}