'use client';

import { useState, useEffect } from 'react';
import { EscrowPayment } from '@/components/EscrowPayment';
import { ProjectActions } from '@/components/ProjectActions';
import { EscrowService } from '@/lib/escrow-service';

export default function ProjectPage({ params }: { params: { id: string } }) {
    const [project, setProject] = useState<any>(null);
    const [escrowPayment, setEscrowPayment] = useState<any>(null);
    const [showPayment, setShowPayment] = useState(false);
    const [loading, setLoading] = useState(true);

    // Mock current user - replace with your auth system
    const currentUserId = 'user-123';

    useEffect(() => {
        loadProjectData();
    }, [params.id]);

    const loadProjectData = async () => {
        // Load project data (replace with your actual data fetching)
        // This is a mock - implement based on your existing project structure
        setProject({
            id: params.id,
            title: 'Sample Project',
            client_id: 'client-123',
            freelancer_id: 'freelancer-456',
            status: 'in_progress',
            budget: 500,
        });

        // Load escrow payment if exists
        const escrow = await EscrowService.getEscrowByProjectId(params.id);
        setEscrowPayment(escrow);
        setLoading(false);
    };

    const handleAcceptBid = () => {
        setShowPayment(true);
    };

    const handlePaymentSuccess = (escrowPaymentId: number) => {
        setShowPayment(false);
        loadProjectData(); // Reload to get updated escrow payment
        alert('Payment successfully held in escrow!');
    };

    const handlePaymentError = (error: string) => {
        alert(`Payment error: ${error}`);
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold">Project: {project?.title}</h1>

            <div className="bg-gray-50 p-4 rounded">
                <p><strong>Status:</strong> {project?.status}</p>
                <p><strong>Budget:</strong> ${project?.budget}</p>
            </div>

            {/* Show payment form if bid is accepted but no escrow payment exists */}
            {!escrowPayment && currentUserId === project?.client_id && (
                <div className="space-y-4">
                    <button
                        onClick={handleAcceptBid}
                        className="bg-blue-500 text-white py-2 px-4 rounded"
                    >
                        Accept Bid & Pay to Escrow
                    </button>

                    {showPayment && (
                        <div className="border p-4 rounded">
                            <h3 className="text-lg font-semibold mb-4">Secure Payment</h3>
                            <EscrowPayment
                                projectId={project.id}
                                clientId={project.client_id}
                                freelancerId={project.freelancer_id}
                                amount={project.budget}
                                onPaymentSuccess={handlePaymentSuccess}
                                onPaymentError={handlePaymentError}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Show project actions if escrow payment exists */}
            {escrowPayment && (
                <ProjectActions
                    project={project}
                    escrowPayment={escrowPayment}
                    currentUserId={currentUserId}
                    onUpdate={loadProjectData}
                />
            )}
        </div>
    );
}