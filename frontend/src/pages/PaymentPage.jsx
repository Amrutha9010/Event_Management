import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axiosClient";
import Loader from "../components/Loader";
import { formatCurrency } from "../utils/format";

function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [instructions, setInstructions] = useState(null);
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get(`/payments/${bookingId}/instructions`)
      .then((response) => { if (active) setInstructions(response.data); })
      .catch((error) => toast.error(error?.response?.data?.message || "Unable to load UPI payment details"))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [bookingId]);

  const submit = async (event) => {
    event.preventDefault();
    if (!transactionId.trim() || !screenshot) { toast.error("Enter the transaction ID and attach the payment screenshot"); return; }
    if (screenshot.size > 5 * 1024 * 1024) { toast.error("Screenshot must be 5 MB or smaller"); return; }
    const form = new FormData();
    form.append("transactionId", transactionId.trim());
    form.append("screenshot", screenshot);
    setSubmitting(true);
    try {
      await api.post(`/payments/${bookingId}/submit`, form, { timeout: 30000 });
      toast.success("Payment proof submitted. The admin will verify it.");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to submit payment proof");
    } finally { setSubmitting(false); }
  };

  if (loading) return <Loader />;
  if (!instructions) return <section className="card"><h2>Payment details unavailable</h2><Link to="/dashboard" className="btn primary">Back to My Bookings</Link></section>;

  return (
    <section className="payment-page">
      <div className="section-head"><h2>Complete UPI Payment</h2></div>
      <div className="card payment-instructions">
        <p><strong>Event:</strong> {instructions.eventName}</p>
        <p><strong>Booking ID:</strong> #{instructions.bookingId}</p>
        <h2>{formatCurrency(instructions.amount)}</h2>
        <p>Scan this QR code using any UPI app, or use the UPI ID below.</p>
        <img className="upi-qr" src={instructions.qrCodeDataUrl} alt="UPI payment QR code" />
        <p><strong>UPI ID:</strong> {instructions.upiId}</p>
        <p><strong>Payee:</strong> {instructions.payeeName}</p>
        {instructions.instructions && <p>{instructions.instructions}</p>}
        <a className="btn primary" href={instructions.upiUri}>Pay using UPI app</a>
        <p className="muted">After payment, return here and submit the UPI transaction/reference ID with a screenshot. Do not upload a screenshot of an unsuccessful or pending payment.</p>
      </div>
      <form className="card payment-proof-form" onSubmit={submit}>
        <h3>Submit payment proof</h3>
        <label htmlFor="transactionId">UPI transaction / reference ID</label>
        <input id="transactionId" value={transactionId} onChange={(event) => setTransactionId(event.target.value)} minLength={6} maxLength={100} required placeholder="Enter transaction ID" />
        <label htmlFor="paymentScreenshot">Payment screenshot (JPG, PNG or WEBP, max 5 MB)</label>
        <input id="paymentScreenshot" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setScreenshot(event.target.files?.[0] || null)} required />
        {screenshot && <p className="muted">Selected: {screenshot.name}</p>}
        <button className="btn primary" type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit for verification"}</button>
        <Link to="/dashboard" className="btn ghost">Submit later</Link>
      </form>
    </section>
  );
}
export default PaymentPage;
