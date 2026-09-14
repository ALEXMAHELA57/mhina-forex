import dotenv from 'dotenv';
dotenv.config();

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_IMAGES_API_TOKEN;
// Found on the same Hosted Images dashboard page as the Account ID —
// distinct from the Account ID itself. Needed to build public delivery URLs.
const ACCOUNT_HASH = process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH;

/**
 * Builds the public delivery URL for an image already stored in
 * Cloudflare Images. `variant` defaults to the "public" variant that
 * exists on every image unless you've defined custom named variants.
 */
export function getImageDeliveryUrl(imageId, variant = 'public') {
  return `https://imagedelivery.net/${ACCOUNT_HASH}/${imageId}/${variant}`;
}

/**
 * Requests a one-time direct-upload URL from Cloudflare Images.
 * The browser uploads straight to Cloudflare using this URL — the file
 * never passes through our server, keeping upload bandwidth off our API.
 * Docs: https://developers.cloudflare.com/images/upload-images/direct-creator-upload/
 */
export async function createDirectUploadUrl() {
  const resp = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v2/direct_upload`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    }
  );

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Cloudflare Images direct-upload request failed: ${errText}`);
  }

  const json = await resp.json();
  // json.result = { id, uploadURL }
  return json.result;
}
