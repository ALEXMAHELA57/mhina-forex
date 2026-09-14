import { useState } from 'react';
import { api } from '../lib/api.js';
import { uploadImage } from '../lib/uploadImage.js';
import { uploadDocument } from '../lib/uploadDocument.js';

/**
 * The whole manual payment loop, in one component: request -> see
 * instructions + a reference code -> upload proof (photo or PDF) ->
 * submitted, waiting on admin review. Used for membership upgrades,
 * course purchases, and live-session purchases alike via `purpose`.
 */
export default function ManualPaymentFlow({ purpose, targetTier, billingPeriod, contentId, price, label }) {
  const [request, setRequest] = useState(null);
  const [instructions, setInstructions] = useState(null);
  const [file, setFile] = useState(null);
  const [starting, setStarting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  function copyAddress() {
    navigator.clipboard.writeText(instructions.crypto.address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function startRequest() {
    setStarting(true);
    setError(null);
    try {
      const body = purpose === 'membership' ? { purpose, targetTier, billingPeriod } : { purpose, contentId };
      const res = await api.post('/manual-payments/request', body);
      setRequest(res.request);
      setInstructions(res.instructions);
    } catch (err) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  }

  async function submitProof(e) {
    e.preventDefault();
    if (!file) {
      setError('Choose a screenshot or PDF receipt first');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      let mediaId;
      if (file.type === 'application/pdf') {
        const media = await uploadDocument(file);
        mediaId = media.id;
      } else {
        const { media } = await uploadImage(file);
        mediaId = media.id;
      }
      await api.post(`/manual-payments/${request.id}/proof`, { proofMediaId: mediaId });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  if (submitted) {
    return <p className="success-msg">Submitted — an admin will verify your payment shortly.</p>;
  }

  if (request) {
    return (
      <div className="manual-payment-panel">
        <p><strong>Amount:</strong> ${request.amount}</p>
        <p><strong>Reference:</strong> {request.id.slice(0, 8)} — include this when you pay, if possible</p>
        <div className="payment-instructions">
          <p>Send exactly <strong>${request.amount} in {instructions.crypto.currency} ({instructions.crypto.network})</strong> to:</p>
          <div className="crypto-address-row">
            <p className="crypto-address">{instructions.crypto.address}</p>
            <button type="button" onClick={copyAddress} className="copy-address-btn">{copied ? 'Copied!' : 'Copy'}</button>
          </div>
          <p className="crypto-warning">⚠️ TRC20 network only — sending on any other network will result in lost funds.</p>
        </div>
        <form onSubmit={submitProof} className="proof-upload-form">
          <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files[0] ?? null)} />
          <button type="submit" disabled={uploading}>{uploading ? 'Uploading…' : 'Submit proof of payment'}</button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return (
    <>
      <button onClick={startRequest} disabled={starting}>{starting ? 'Starting…' : (label || `Buy for $${price}`)}</button>
      {error && <p className="error">{error}</p>}
    </>
  );
}
