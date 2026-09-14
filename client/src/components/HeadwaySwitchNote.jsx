import { useState } from 'react';

const HEADWAY_LINK = import.meta.env.VITE_HEADWAY_REFERRAL_LINK
  || 'https://headway.partners/user/signup?hwp=dfe932';

// The partner code is the value after "hwp=" in the referral link —
// extracted here so it stays in sync automatically if the link ever
// changes, rather than being hardcoded a second time.
function extractPartnerCode(link) {
  try {
    return new URL(link).searchParams.get('hwp') || link;
  } catch {
    return link;
  }
}

const PARTNER_CODE = extractPartnerCode(HEADWAY_LINK);

/**
 * For people who already have a Headway account under a DIFFERENT
 * partner. Per Headway's own IB support docs, switching isn't
 * self-service through the referral link — the client has to email
 * Headway support directly with the new partner's code. This gives them
 * everything needed to do that in one place: the code (copyable) and a
 * pre-filled email so there's nothing to type or look up.
 */
export default function HeadwaySwitchNote() {
  const [copied, setCopied] = useState(false);
  const [headwayId, setHeadwayId] = useState('');

  function copyCode() {
    navigator.clipboard.writeText(PARTNER_CODE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const mailtoLink = `mailto:partner@hw.site?subject=${encodeURIComponent(
    'Request to switch partner attachment'
  )}&body=${encodeURIComponent(
    `Hello Headway team,\n\nI'd like to request that my existing Headway account be attached to this partner:\n\nMy Headway account email/ID: ${headwayId || '[enter your Headway account email/ID here]'}\nPartner code: ${PARTNER_CODE}\n\nThank you.`
  )}`;

  return (
    <div className="headway-switch-note">
      <p>
        Already have a Headway account under a different partner? You can switch —
        email Headway support and include our partner code below.
      </p>
      <input
        placeholder="Your Headway account email/ID"
        value={headwayId}
        onChange={(e) => setHeadwayId(e.target.value)}
        className="headway-switch-id-input"
      />
      <div className="crypto-address-row">
        <p className="crypto-address">{PARTNER_CODE}</p>
        <button type="button" onClick={copyCode} className="copy-address-btn">
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <a href={mailtoLink} className="btn-primary headway-switch-email-btn">
        Email Headway Support
      </a>
    </div>
  );
}
