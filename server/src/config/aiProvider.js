import dotenv from 'dotenv';
dotenv.config();

/**
 * Thin wrapper so the rest of the app doesn't care which AI provider is
 * behind the Chart/News analyzer. Implemented against the Anthropic API
 * as a sensible default (strong at structured reasoning over an image),
 * but swap the fetch call here if you choose a different provider —
 * nothing else in the codebase needs to change.
 */
export async function analyzeChartImage({ imageUrl, instrument, timeframe, tradeType }) {
  const systemPrompt = `You are MHINA FOREX's chart analysis assistant. Analyze the provided
chart and return STRICT JSON with keys: structure, keyLevel, confirmation, entryZone,
stopLoss, takeProfit, riskReward, noClearSetup (boolean). If conditions are unclear,
set noClearSetup=true and leave trade fields null. Never force a BUY/SELL.
This is educational analysis, not a guaranteed trade outcome.`;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: imageUrl } },
            {
              type: 'text',
              text: `Instrument: ${instrument}. Timeframe: ${timeframe}. Trade type interest: ${tradeType || 'any'}.`,
            },
          ],
        },
      ],
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`AI provider request failed: ${errText}`);
  }

  const json = await resp.json();
  const textBlock = json.content?.find((b) => b.type === 'text')?.text ?? '{}';

  try {
    return JSON.parse(textBlock);
  } catch {
    // Model didn't return clean JSON — surface raw text so it's visible
    // during debugging rather than silently failing.
    return { noClearSetup: true, raw: textBlock };
  }
}
