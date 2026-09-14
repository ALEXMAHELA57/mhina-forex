import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

const LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;
const API_KEY = process.env.BUNNY_STREAM_API_KEY;

/**
 * Creates a video object in the Bunny Stream library and returns its GUID.
 * The client then uploads the actual file bytes directly to Bunny using
 * that GUID (TUS resumable upload) — again, bypassing our server.
 * Docs: https://docs.bunny.net/reference/video_createvideo
 */
export async function createBunnyVideo(title) {
  const resp = await fetch(
    `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`,
    {
      method: 'POST',
      headers: {
        AccessKey: API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    }
  );

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Bunny Stream create-video request failed: ${errText}`);
  }

  return resp.json(); // { guid, ... }
}

/**
 * Generates the TUS upload authorization for a given video GUID, so the
 * BROWSER can upload the file bytes directly to Bunny (never through our
 * server) while still proving it's authorized — without ever exposing
 * the private BUNNY_STREAM_API_KEY to the client.
 * Signature spec: SHA256(libraryId + apiKey + expiration + videoId), hex.
 * Docs: https://docs.bunny.net/docs/stream-uploading-directly-from-frontend
 */
export function generateTusUploadAuth(videoGuid, expiresInSeconds = 3600) {
  const expire = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const signature = crypto
    .createHash('sha256')
    .update(`${LIBRARY_ID}${API_KEY}${expire}${videoGuid}`)
    .digest('hex');

  return {
    libraryId: LIBRARY_ID,
    signature,
    expire,
    endpoint: 'https://video.bunnycdn.com/tusupload',
  };
}

/**
 * Generates a signed, time-limited playback token for a Bunny video, so
 * only users who've passed the tier/access check on our API can watch —
 * this is what enforces "view only" access at the delivery layer.
 * Requires Token Authentication to be enabled on the Bunny Stream library.
 * Docs: https://docs.bunny.net/docs/stream-embed-view-token-authentication
 */
export function signPlaybackUrl(videoGuid, expiresInSeconds = 3600) {
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  // TODO: implement the SHA256 token per Bunny's token-auth spec once the
  // library's signing key is available — placeholder shape shown below.
  const token = 'REPLACE_WITH_SHA256_TOKEN';
  return `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${videoGuid}?token=${token}&expires=${expires}`;
}
