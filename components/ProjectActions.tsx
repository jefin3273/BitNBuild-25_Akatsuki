'use client';

import { useState } from 'react';
import { EscrowPayment } from '@/lib/escrow-service';

interface ProjectActionsProps {
    project: any;
    escrowPayment: EscrowPayment | null;
    currentUserId: string;
    onUpdate: () => void;
}

export function ProjectActions({
    project,
    escrowPayment,
    currentUserId,
    onUpdate
}: ProjectActionsProps) {
    const [loading, setLoading] = useState(false);

    const releasePayment = async () => {
        if (!escrowPayment) return;

        setLoading(true);
        try {
            const response = await fetch('/api/escrow/release', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    escrowPaymentId: escrowPayment.id,
                    clientId: currentUserId,
                }),
            });

            if (response.ok) {
                alert('Payment released successfully!');
                onUpdate();
            } else {
                alert('Failed to release payment');
            }
        } catch (error) {
            alert('Error releasing payment');
        }
        setLoading(false);
    };

    const refundPayment = async () => {
        if (!escrowPayment) return;

        const reason = prompt('Please provide a reason for the refund:');
        if (!reason) return;

        setLoading(true);
        try {
            const response = await fetch('/api/escrow/refund', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    escrowPaymentId: escrowPayment.id,
                    reason,
                }),
            });

            if (response.ok) {
                alert('Payment refunded successfully!');
                onUpdate();
            } else {
                alert('Failed to refund payment');
            }
        } catch (error) {
            alert('Error refunding payment');
        }
        setLoading(false);
    };

    // Show different actions based on user role and payment status
    if (!escrowPayment) {
        return <div>No escrow payment found</div>;
    }

    return (
        <div className="space-y-4 p-4 border rounded">
            <h3 className="text-lg font-semibold">Payment Status</h3>
            <div className="text-sm space-y-2">
                <p><strong>Amount:</strong> ${escrowPayment.amount}</p>
                <p><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs ${escrowPayment.status === 'held' ? 'bg-yellow-100 text-yellow-800' :
                    escrowPayment.status === 'released' ? 'bg-green-100 text-green-800' :
                        escrowPayment.status === 'refunded' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                    }`}>{escrowPayment.status.toUpperCase()}</span></p>
            </div>

            {/* Client actions */}
            {currentUserId === project.client_id && (
                <div className="space-y-2">
                    {escrowPayment.status === 'held' && project.status === 'completed' && (
                        <button
                            onClick={releasePayment}
                            disabled={loading}
                            className="w-full bg-green-500 text-white py-2 px-4 rounded disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Approve & Release Payment'}
                        </button>
                    )}

                    {escrowPayment.status === 'held' && (
                        <button
                            onClick={refundPayment}
                            disabled={loading}
                            className="w-full bg-red-500 text-white py-2 px-4 rounded disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Request Refund'}
                        </button>
                    )}
                </div>
            )}

            {/* Freelancer info */}
            {currentUserId === project.freelancer_id && (
                <div className="text-sm text-gray-600">
                    {escrowPayment.status === 'held' && (
                        <p>Payment is held in escrow. Complete the project and wait for client approval.</p>
                    )}
                    {escrowPayment.status === 'released' && (
                        <p>Payment has been released! You should receive it within 2-7 business days.</p>
                    )}
                </div>
            )}
        </div>
    );
}