import { NextRequest, NextResponse } from 'next/server';
import { EscrowService } from '@/lib/escrow-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { escrowPaymentId, clientId } = body;

        const result = await EscrowService.releasePayment(escrowPaymentId, clientId);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Payment release error:', error);
        return NextResponse.json(
            { error: 'Failed to release payment' },
            { status: 500 }
        );
    }
}