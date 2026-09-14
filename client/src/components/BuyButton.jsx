import { useState } from 'react';
import { api } from '../lib/api.js';

/**
 * Standalone purchase flow for a priced course/session — independent of
 * membership tier. Prompts for a phone number (needed for AzamPay mobile
 * money checkout), then calls whichever checkout endpoint the caller
 * points it at.
 */
export default function BuyButton({ checkoutPath, price, label, extraBody }) {
  const [showForm, setShowForm] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [checkoutInfo, setCheckoutInfo] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { checkout } = await api.post(checkoutPath, { phoneNumber, ...extraBody });
      setCheckoutInfo(checkout);
      // TODO: once AzamPay's real checkout response shape is confirmed,
      // redirect/display according to what it actually returns (a
      // checkout URL, a USSD prompt instruction, etc.) instead of
      // just showing the raw response.
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (checkoutInfo) {
    return <p>Payment initiated — check your phone to complete it.</p>;
  }

  if (!showForm) {
    return <button onClick={() => setShowForm(true)}>{label || `Buy for $${price}`}</button>;
  }

  return (
    <form onSubmit={submit} className="buy-form">
      <input
        placeholder="Phone number (for mobile money)"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        required
      />
      <button type="submit" disabled={submitting}>{submitting ? 'Processing…' : `Pay $${price}`}</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
