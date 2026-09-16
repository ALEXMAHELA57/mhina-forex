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
  console.log('AI analyzer: sending image URL to Claude:', imageUrl);

  const systemPrompt = `You are MHINA FOREX's chart analysis assistant. Analyze the provided
chart and return STRICT JSON with keys: structure, keyLevel, confirmation, entryZone,
stopLoss, takeProfit, riskReward, noClearSetup (boolean). If conditions are unclear,
set noClearSetup=true and leave trade fields null. Never force a BUY/SELL.
This is educational analysis, not a guaranteed trade outcome.
Respond with ONLY the raw JSON object — no markdown code fences, no \`\`\`json wrapper,
no explanation before or after it. Your entire response must be valid JSON, starting
with { and ending with }.`;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
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
  console.log('AI analyzer: raw model response:', textBlock);

  // Defensive: even with an explicit instruction not to, models sometimes
  // still wrap JSON in markdown code fences (```json ... ```). Strip that
  // before parsing rather than treating it as a real "no clear setup"
  // result — this was previously causing EVERY analysis to come back
  // inconclusive regardless of what the chart actually showed.
  const cleaned = textBlock.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Still not valid JSON after stripping fences — now this really is
    // worth surfacing as a parse failure for debugging, rather than a
    // genuine "no clear setup" analysis result.
    console.error('AI analyzer: failed to parse model response as JSON:', textBlock);
    return { noClearSetup: true, raw: textBlock };
  }
}
