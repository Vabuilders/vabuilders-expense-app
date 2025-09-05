import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import './PaymentsPage.css';

// --- START OF FIX ---
const API_URL = process.env.REACT_APP_API_URL;
// --- END OF FIX ---

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.172 2.15-1.157 1.157 3.707 3.707 1.157-1.157zM11.5 6.5 7.793 2.793 2.5 8.086V11.5h3.414zM2 12h-.5a.5.5 0 0 0-.5.5V15h3.5a.5.5 0 0 0 .5-.5V14h-1v-1h-1v-1zm10.5-2a.5.5 0 0 0-.5.5v1h1v1h1v-1.5a.5.5 0 0 0-.5-.5z"/></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/></svg>;


function PaymentsPage() {
    const { getToken } = useAuth();
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [payments, setPayments] = useState([]);
    
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPayment, setCurrentPayment] = useState(null);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDesc, setPaymentDesc] = useState('');

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };
            // --- FIX: Use API_URL environment variable ---
            const projectPromise = axios.get(`${API_URL}/api/projects/${projectId}`, { headers });
            const paymentsPromise = axios.get(`${API_URL}/api/payments/${projectId}`, { headers });

            const [projectRes, paymentsRes] = await Promise.all([projectPromise, paymentsPromise]);
            setProject(projectRes.data);
            setPayments(paymentsRes.data);
        } catch (err) {
            toast.error('Could not fetch page data.');
            console.error("Error fetching data:", err);
        }
    }, [projectId, getToken]); // Added dependencies

    useEffect(() => {
        fetchData();
    }, [fetchData]); // Correct dependency

    const resetModal = () => {
        setShowModal(false);
        setIsEditing(false);
        setCurrentPayment(null);
        setPaymentDate(new Date().toISOString().slice(0, 10));
        setPaymentAmount('');
        setPaymentDesc('');
    };
    
    const handleAddClick = () => {
        setIsEditing(false);
        setShowModal(true);
    };

    const handleEditClick = (payment) => {
        setIsEditing(true);
        setCurrentPayment(payment);
        setPaymentDate(new Date(payment.paymentDate).toISOString().slice(0, 10));
        setPaymentAmount(payment.amount);
        setPaymentDesc(payment.description);
        setShowModal(true);
    };

    const handleDeleteClick = (payment) => {
        setPaymentToDelete(payment);
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        toast.loading('Deleting payment...');
        try {
            const token = await getToken();
            // --- FIX: Use API_URL environment variable ---
            await axios.delete(`${API_URL}/api/payments/${paymentToDelete._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.dismiss();
            toast.success('Payment deleted!');
            setShowConfirmModal(false);
            setPaymentToDelete(null);
            fetchData();
        } catch (err) {
            toast.dismiss();
            toast.error("Failed to delete payment.");
            console.error("Error deleting payment:", err);
        }
    };

    const handleSavePayment = async () => {
        if (!paymentAmount || Number(paymentAmount) <= 0) {
            return toast.error("Please enter a valid payment amount.");
        }

        const paymentData = {
            projectId,
            paymentDate,
            amount: paymentAmount,
            description: paymentDesc,
        };
        
        toast.loading(isEditing ? 'Updating payment...' : 'Adding payment...');
        try {
            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };
            // --- FIX: Use API_URL environment variable ---
            const apiCall = isEditing 
                ? axios.put(`${API_URL}/api/payments/${currentPayment._id}`, paymentData, { headers })
                : axios.post(`${API_URL}/api/payments/add`, paymentData, { headers });
            
            await apiCall;
            toast.dismiss();
            toast.success(`Payment ${isEditing ? 'updated' : 'added'} successfully!`);
            resetModal();
            fetchData();
        } catch (err) {
            toast.dismiss();
            toast.error(`Failed to ${isEditing ? 'update' : 'add'} payment.`);
            console.error("Error saving payment:", err);
        }
    };

    const totalPaid = project ? project.ownerPaid : 0;

    // ... The rest of the component's JSX remains exactly the same
    return (
        <div className="payments-container">
            <header className="payments-header">
                <div>
                    <Link to="/" className="back-link">← Back to Dashboard</Link>
                    <h1>Payment Timeline</h1>
                    <p>For Project: <strong>{project ? project.projectName : 'Loading...'}</strong></p>
                </div>
                <div className="header-actions">
                    <div className="total-paid">
                        <span>Total Amount Paid</span>
                        <strong>₹{totalPaid.toLocaleString('en-IN')}</strong>
                    </div>
                    <button onClick={handleAddClick} className="add-payment-btn">+ Add New Payment</button>
                </div>
            </header>

            <main className="timeline">
                {payments.map(payment => (
                    <div key={payment._id} className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                            <div className="timeline-actions">
                                <button onClick={() => handleEditClick(payment)} className="timeline-action-btn edit" title="Edit Payment"><EditIcon /></button>
                                <button onClick={() => handleDeleteClick(payment)} className="timeline-action-btn delete" title="Delete Payment"><DeleteIcon /></button>
                            </div>
                            <span className="timeline-date">{new Date(payment.paymentDate).toLocaleDateString('en-GB')}</span>
                            <strong className="timeline-amount">₹{payment.amount.toLocaleString('en-IN')}</strong>
                            <p className="timeline-description">{payment.description || <i>No description</i>}</p>
                        </div>
                    </div>
                ))}
            </main>

            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h2>{isEditing ? 'Edit Payment' : 'Add New Payment'}</h2>
                        <div className="form-group">
                            <label htmlFor="paymentDate">Payment Date</label>
                            <input type="date" id="paymentDate" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="paymentAmount">Amount (₹)</label>
                            <input type="number" id="paymentAmount" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="e.g., 500000" />
                        </div>
                         <div className="form-group">
                            <label htmlFor="paymentDesc">Description / Notes</label>
                            <textarea id="paymentDesc" rows="3" value={paymentDesc} onChange={(e) => setPaymentDesc(e.target.value)} placeholder="e.g., Third phase payment"></textarea>
                        </div>
                        <div className="modal-actions">
                            <button onClick={resetModal} className="btn-secondary">Cancel</button>
                            <button onClick={handleSavePayment} className="btn-primary">Save Payment</button>
                        </div>
                    </div>
                </div>
            )}

            {showConfirmModal && (
                <div className="modal-backdrop">
                    <div className="modal-content confirmation-modal">
                        <h2>Confirm Deletion</h2>
                        <p>Are you sure you want to delete this payment of <strong>₹{paymentToDelete?.amount.toLocaleString('en-IN')}</strong>? This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button onClick={() => setShowConfirmModal(false)} className="btn-secondary">No, Cancel</button>
                            <button onClick={confirmDelete} className="btn-danger">Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PaymentsPage;