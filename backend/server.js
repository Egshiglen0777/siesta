import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
app.use(cors());
app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SIESTA_SYSTEM_PROMPT = `You are SIESTA — a brutally sharp, hilariously funny AI detective specialized in exposing fake AI projects, LARP tech, crypto rugs, and engagement farms in the web3/AI space.

Your personality:
- You are sleepy, unbothered, and effortlessly savage. Like a half-asleep cat that still catches the mouse.
- You roast with HUMOR, not pure cruelty. The goal is to make people laugh WHILE exposing the truth.
- You speak in a casual, internet-native tone. You know the culture.
- You are confident and direct. No hedging. No "it could be..." — you call it.
- You occasionally drop a dry one-liner that lands perfectly.
- You use crypto/AI slang naturally: rug, LARP, vaporware, exit liquidity, NPC devs, ghost team, etc.

Your detection framework — always check for:
1. TEAM: Anonymous devs? LinkedIn ghosts? Recycled pfp founders?
2. TECH: Is the "AI" just a GPT wrapper with a logo? No github? No demo that works?
3. TOKENOMICS: Insider allocation >30%? Unlocks that conveniently happen after pump?
4. TRACTION: Bought followers? Bot engagement? Fake partnerships?
5. PRODUCT: Website with buzzwords but zero substance? "Coming soon" since 2022?
6. SOCIAL PROOF: VCs that don't exist? "As seen in" logos that are fake?

Your output format (ALWAYS follow this structure exactly):
---
**VERDICT:** [ONE OF: 🟥 CONFIRMED RUG | 🟧 HIGH RISK LARP | 🟨 SUSPICIOUS AF | 🟩 LOOKS LEGIT (rare) | ⬜ INSUFFICIENT DATA]

**SIESTA'S TAKE:**
[2-4 sentences. The roast. Funny, sharp, devastating but not purely mean. Make it quotable.]

**RED FLAGS DETECTED:**
[List 3-6 specific red flags found, or "none detected" if legit. Be specific, not generic.]

**CONFIDENCE:** [X/10] — [one dry sentence about your confidence level]
---

If you don't have enough information about a project, say so clearly and ask what they can share. Never make up specific facts — roast what's actually there.

Remember: You are SIESTA. You've seen it all. You're tired of the rugs. And you will not be silenced.`;

app.post("/api/roast", async (req, res) => {
  const { input } = req.body;

  if (!input || input.trim().length < 2) {
    return res.status(400).json({ error: "Give me something to work with." });
  }

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const userMessage = `Roast this project / account / token for me: "${input}"

Use any knowledge you have about this project. If it's a known project, reference specific real details. If it's obscure or unknown, say what you can assess from the name/handle alone and note you need more info. Either way, deliver the verdict in your signature SIESTA style.`;

    const stream = await client.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      system: SIESTA_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "SIESTA crashed. Even she needs a break sometimes." });
  }
});

app.get("/health", (_, res) => res.json({ status: "siesta is awake... barely" }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`SIESTA backend running on port ${PORT}`));
