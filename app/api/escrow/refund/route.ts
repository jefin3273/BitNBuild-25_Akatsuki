import { NextRequest, NextResponse } from 'next/server';
import { EscrowService } from '@/lib/escrow-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { escrowPaymentId, reason } = body;

        const result = await EscrowService.refundPayment(escrowPaymentId, reason);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Payment refund error:', error);
        return NextResponse.json(
            { error: 'Failed to refund payment' },
            { status: 500 }
        );
    }
}