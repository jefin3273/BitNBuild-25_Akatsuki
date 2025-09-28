'use client';

import { useState, useEffect } from 'react';
import { EscrowPayment } from '@/components/EscrowPayment';
import { ProjectActions } from '@/components/ProjectActions';
import { EscrowService } from '@/lib/escrow-service';

export default function TestEscrowPage() {
    const [step, setStep] = useState(1);
    const [escrowPayment, setEscrowPayment] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<'client' | 'freelancer'>('client');

    // Test data - matches what we inserted above
    const testProject = {
        id: 1,
        title: 'Test Website Development',
        client_id: 1,
        freelancer_id: 2,
        status: 'open',
        budget_max: 500,
    };

    const loadEscrowPayment = async () => {
        const escrow = await EscrowService.getEscrowByProjectId(testProject.id.toString());
        setEscrowPayment(escrow);
    };

    useEffect(() => {
        loadEscrowPayment();
    }, []);

    const handlePaymentSuccess = (escrowPaymentId: number) => {
        alert('✅ Payment successfully held in escrow!');
        setStep(2);
        loadEscrowPayment();
    };

    const handlePaymentError = (error: string) => {
        alert(`❌ Payment error: ${error}`);
    };

    const simulateWorkCompletion = async () => {
        // In real app, this would be done by freelancer
        alert('🔨 Freelancer has completed the work!');
        setStep(3);
    };

    const getCurrentUserId = () => {
        return currentUser === 'client' ? testProject.client_id : testProject.freelancer_id;
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-4">🧪 Escrow System Testing</h1>

                {/* User Switcher */}
                <div className="bg-gray-100 p-4 rounded mb-6">
                    <label className="block text-sm font-medium mb-2">Test as:</label>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setCurrentUser('client')}
                            className={`px-4 py-2 rounded ${currentUser === 'client'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white border'
                                }`}
                        >
                            👤 Client (User ID: 1)
                        </button>
                        <button
                            onClick={() => setCurrentUser('freelancer')}
                            className={`px-4 py-2 rounded ${currentUser === 'freelancer'
                                ? 'bg-green-500 text-white'
                                : 'bg-white border'
                                }`}
                        >
                            💻 Freelancer (User ID: 2)
                        </button>
                    </div>
                </div>

                {/* Current Step Indicator */}
                <div className="flex items-center mb-6">
                    {[1, 2, 3, 4].map((stepNum) => (
                        <div key={stepNum} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= stepNum
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-300 text-gray-600'
                                }`}>
                                {stepNum}
                            </div>
                            {stepNum < 4 && <div className="w-16 h-1 bg-gray-300 mx-2"></div>}
                        </div>
                    ))}
                </div>

                <div className="text-sm text-gray-600 mb-6">
                    <strong>Steps:</strong> 1️⃣ Pay to Escrow → 2️⃣ Work in Progress → 3️⃣ Work Complete → 4️⃣ Payment Released
                </div>
            </div>

            {/* Project Info */}
            <div className="bg-white border rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">📋 Project Details</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Title:</strong> {testProject.title}</div>
                    <div><strong>Budget:</strong> ${testProject.budget_max}</div>
                    <div><strong>Client ID:</strong> {testProject.client_id}</div>
                    <div><strong>Freelancer ID:</strong> {testProject.freelancer_id}</div>
                    <div><strong>Status:</strong> {testProject.status}</div>
                    <div><strong>Project ID:</strong> {testProject.id}</div>
                </div>
            </div>

            {/* Step 1: Payment to Escrow */}
            {step === 1 && !escrowPayment && currentUser === 'client' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">💳 Step 1: Pay to Escrow</h2>
                    <p className="text-gray-700 mb-4">
                        As a client, you need to pay the project amount to escrow before work begins.
                    </p>

                    <div className="bg-white rounded p-4">
                        <EscrowPayment
                            projectId={testProject.id}
                            clientId={testProject.client_id}
                            freelancerId={testProject.freelancer_id}
                            amount={testProject.budget_max}
                            onPaymentSuccess={handlePaymentSuccess}
                            onPaymentError={handlePaymentError}
                        />
                    </div>
                </div>
            )}

            {/* Step 1: Waiting for payment (freelancer view) */}
            {step === 1 && !escrowPayment && currentUser === 'freelancer' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">⏳ Waiting for Client Payment</h2>
                    <p className="text-gray-700">
                        The client needs to pay the project amount to escrow before you can start working.
                    </p>
                </div>
            )}

            {/* Step 2: Work in Progress */}
            {step === 2 && escrowPayment && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">🔨 Step 2: Work in Progress</h2>
                    <p className="text-gray-700 mb-4">
                        Payment is held securely in escrow. Freelancer can now start working.
                    </p>

                    {currentUser === 'freelancer' && (
                        <button
                            onClick={simulateWorkCompletion}
                            className="bg-green-500 text-white px-4 py-2 rounded"
                        >
                            ✅ Mark Work as Complete
                        </button>
                    )}

                    {currentUser === 'client' && (
                        <p className="text-sm text-gray-600">
                            💡 Switch to Freelancer view to simulate work completion
                        </p>
                    )}
                </div>
            )}

            {/* Step 3: Work Complete - Waiting for Approval */}
            {/* Step 3: Work Complete - Waiting for Approval */}
            {step >= 3 && escrowPayment && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">✅ Step 3: Work Complete</h2>
                    <p className="text-gray-700 mb-4">
                        Freelancer has completed the work. Client can now review and approve.
                    </p>

                    {currentUser === 'client' && (
                        <button
                            onClick={async () => {
                                try {
                                    await EscrowService.releasePayment(escrowPayment.id, testProject.client_id);
                                    alert('💸 Funds released to freelancer!');
                                    setStep(4);
                                    loadEscrowPayment();
                                } catch (err: any) {
                                    alert(`❌ Failed to release funds: ${err.message}`);
                                }
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded"
                        >
                            ✅ Approve & Release Funds
                        </button>
                    )}
                </div>
            )}


            {/* Escrow Payment Status */}
            {escrowPayment && (
                <div className="bg-white border rounded-lg p-6">
                    <ProjectActions
                        project={testProject}
                        escrowPayment={escrowPayment}
                        currentUserId={getCurrentUserId().toString()}
                        onUpdate={() => {
                            loadEscrowPayment();
                            setStep(4);
                        }}
                    />
                </div>
            )}

            {/* Debug Information */}
            <details className="mt-6">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    🔍 Debug Information (Click to expand)
                </summary>
                <div className="mt-2 p-4 bg-gray-100 rounded text-sm">
                    <div><strong>Current Step:</strong> {step}</div>
                    <div><strong>Current User:</strong> {currentUser}</div>
                    <div><strong>Current User ID:</strong> {getCurrentUserId()}</div>
                    <div><strong>Escrow Payment:</strong> {escrowPayment ? 'Exists' : 'None'}</div>
                    {escrowPayment && (
                        <div className="mt-2">
                            <strong>Escrow Details:</strong>
                            <pre className="mt-1 text-xs bg-white p-2 rounded">
                                {JSON.stringify(escrowPayment, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </details>
        </div>
    );
}