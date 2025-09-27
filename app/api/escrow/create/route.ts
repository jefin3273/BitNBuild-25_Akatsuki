import { NextRequest, NextResponse } from 'next/server';
import { EscrowService } from '@/lib/escrow-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('API received body:', body);

        const { projectId, clientId, freelancerId, amount, currency } = body;

        // Convert to numbers and validate
        const projectIdNum = parseInt(projectId);
        const clientIdNum = parseInt(clientId);
        const freelancerIdNum = parseInt(freelancerId);
        const amountNum = parseFloat(amount);

        console.log('Converted values:', {
            projectId: projectIdNum,
            clientId: clientIdNum,
            freelancerId: freelancerIdNum,
            amount: amountNum,
        });

        if (!projectIdNum || !clientIdNum || !freelancerIdNum || !amountNum) {
            return NextResponse.json(
                { error: 'Missing or invalid required fields' },
                { status: 400 }
            );
        }

        const result = await EscrowService.createEscrowPayment({
            projectId: projectIdNum,
            clientId: clientIdNum,
            freelancerId: freelancerIdNum,
            amount: amountNum,
            currency,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Escrow creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create escrow payment', details: error },
            { status: 500 }
        );
    }
}