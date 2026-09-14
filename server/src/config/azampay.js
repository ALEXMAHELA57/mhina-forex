import dotenv from 'dotenv';
dotenv.config();

const ENV = process.env.AZAMPAY_ENV === 'production' ? 'production' : 'sandbox';
const AUTH_BASE = ENV === 'production'
  ? 'https://authenticator.azampay.co.tz'
  : 'https://authenticator-sandbox.azampay.co.tz';
const CHECKOUT_BASE = ENV === 'production'
  ? 'https://checkout.azampay.co.tz'
  : 'https://sandbox.azampay.co.tz';

let cachedToken = null;
let cachedTokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedTokenExpiry) return cachedToken;

  const resp = await fetch(`${AUTH_BASE}/AppRegistration/GenerateToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appName: process.env.AZAMPAY_APP_NAME,
      clientId: process.env.AZAMPAY_CLIENT_ID,
      clientSecret: process.env.AZAMPAY_CLIENT_SECRET,
    }),
  });

  if (!resp.ok) throw new Error(`AzamPay auth failed: ${await resp.text()}`);
  const json = await resp.json();

  cachedToken = json.data.accessToken;
  cachedTokenExpiry = Date.now() + 50 * 60 * 1000; // refresh a bit before real expiry
  return cachedToken;
}

/**
 * Initiates a checkout for a membership package. Returns whatever AzamPay
 * gives back (e.g. a redirect/payment reference) for the client to
 * continue the payment flow. Actual field names should be confirmed
 * against AzamPay's current Checkout API docs before going live.
 */
export async function initiateCheckout({ amount, currency, externalId, vendorId, userPhone, redirectSuccessUrl, redirectFailUrl }) {
  const token = await getAccessToken();

  const resp = await fetch(`${CHECKOUT_BASE}/azampay/mno/checkout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currencyIso: currency ?? 'TZS',
      externalId,
      vendorId,
      accountNumber: userPhone,
      provider: 'Airtel', // TODO: let the client pick the MNO, or add a card path
    }),
  });

  const rawBody = await resp.text();

  if (!resp.ok) throw new Error(`AzamPay checkout failed (${resp.status}): ${rawBody || '(empty response)'}`);

  if (!rawBody) {
    throw new Error('AzamPay returned an empty response body for what should be a successful checkout request — check that vendorId, amount, and accountNumber are all valid for the sandbox.');
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new Error(`AzamPay returned a non-JSON response: ${rawBody.slice(0, 200)}`);
  }
}
