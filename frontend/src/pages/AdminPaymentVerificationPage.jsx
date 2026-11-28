import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axiosClient";
import EmptyState from "../components/EmptyState";
import Loader from "../components/Loader";
import { asArray } from "../utils/apiData";
import { formatCurrency, formatDate } from "../utils/format";

function AdminPaymentVerificationPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proofUrls, setProofUrls] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [notes, setNotes] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/payments/pending");
      setPayments(asArray(response.data));
    } catch (error) { toast.error(error?.response?.data?.message || "Unable to load payment submissions"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const viewProof = async (bookingId) => {
    try {
      const response = await api.get(`/admin/payments/${bookingId}/proof`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      setProofUrls((old) => ({ ...old, [bookingId]: url }));
    } catch { toast.error("Unable to open payment screenshot"); }
  };

  const review = async (bookingId, decision) => {
    setBusyId(bookingId);
    try {
      await api.put(`/admin/payments/${bookingId}/review`, { decision, note: notes[bookingId] || "" });
      toast.success(decision === "APPROVE" ? "Payment verified and booking confirmed" : "Payment rejected and booking cancelled");
      setPayments((old) => old.filter((payment) => payment.bookingId !== bookingId));
    } catch (error) { toast.error(error?.response?.data?.message || "Payment review failed"); }
    finally { setBusyId(null); }
  };

  if (loading) return <Loader />;
  return (
    <section>
      <div className="section-head split"><h2>Payment Verification</h2><Link className="btn ghost" to="/admin">Admin Dashboard</Link></div>
      {payments.length === 0 ? <EmptyState title="No payments awaiting verification" message="New UPI payment submissions will appear here." /> : (
        <div className="payment-review-list">
          {payments.map((payment) => (
            <article className="card payment-review-card" key={payment.bookingId}>
              <div className="section-head split"><h3>Booking #{payment.bookingId} · {payment.eventName}</h3><span className="status pending">UNDER REVIEW</span></div>
              <div className="payment-review-details">
                <p><strong>Customer:</strong> {payment.customerName} ({payment.customerEmail})</p>
                <p><strong>Event date:</strong> {formatDate(payment.eventDate)}</p>
                <p><strong>Tickets:</strong> {payment.quantity}</p>
                <p><strong>Amount:</strong> {formatCurrency(payment.amount)}</p>
                <p><strong>UPI transaction ID:</strong> {payment.transactionId}</p>
                <p><strong>Submitted:</strong> {formatDate(payment.submittedAt)}</p>
              </div>
              <button className="btn ghost" type="button" onClick={() => viewProof(payment.bookingId)}>View payment screenshot</button>
              {proofUrls[payment.bookingId] && <img className="payment-proof-preview" src={proofUrls[payment.bookingId]} alt={`Payment proof for booking ${payment.bookingId}`} />}
              <label htmlFor={`note-${payment.bookingId}`}>Admin note (optional)</label>
              <textarea id={`note-${payment.bookingId}`} value={notes[payment.bookingId] || ""} onChange={(event) => setNotes((old) => ({ ...old, [payment.bookingId]: event.target.value }))} maxLength={500} placeholder="Reason if rejecting, or a note for the customer" />
              <div className="inline-actions">
                <button className="btn success" disabled={busyId === payment.bookingId} onClick={() => review(payment.bookingId, "APPROVE")}>Verify & confirm booking</button>
                <button className="btn danger" disabled={busyId === payment.bookingId} onClick={() => review(payment.bookingId, "REJECT")}>Reject payment</button>
              </div>
              <p className="muted">Verify the transaction in the receiving UPI app or bank account before approving. The screenshot is not proof of cleared funds by itself.</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
export default AdminPaymentVerificationPage;
