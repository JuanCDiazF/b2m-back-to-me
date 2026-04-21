export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { dob, city, timeOfDay, motherAge, fatherAge, noParents, openQuestion, layer } = req.body;
  if (!dob) return res.status(400).json({ error: "Missing date of birth" });

  const date = new Date(dob + "T12:00:00");
  const formatted = date.toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
  const year = date.getFullYear();
  const month = date.toLocaleDateString("en-US", { month:"long" });

  let gen = "Generation Z";
  if (year < 1946) gen = "The Silent Generation";
  else if (year < 1965) gen = "Baby Boomer";
  else if (year < 1981) gen = "Generation X";
  else if (year < 1997) gen = "Millennial";
  else if (year < 2013) gen = "Generation Z";
  else gen = "Generation Alpha";

  // Build accumulated context
  let context = `Born: ${formatted}. Generation: ${gen}.`;
  if (city) context += ` City: ${city}.`;
  if (timeOfDay && timeOfDay !== "unknown") context += ` Time of arrival: ${timeOfDay}.`;
  if (noParents) context += ` User did not know their parents.`;
  else {
    if (motherAge) context += ` Mother was ${motherAge} years old.`;
    if (fatherAge) context += ` Father was ${fatherAge} years old.`;
  }
  if (openQuestion) context += ` User's personal question: "${openQuestion}".`;

  const prompts = {
    1: `You are El Cronista — a cinematic, intimate narrator who speaks directly to the person reading. Your voice is warm, slightly mystical, and deeply personal. Never use lists. Always flowing prose.

Context: ${context}

Write a vivid, immersive narrative (~180 words) about what the world felt like on ${formatted}. Cover: the global atmosphere, cultural mood, historical events of that exact moment in ${year}. Make the person feel that their arrival was significant. End with a sense of wonder, not conclusion.

Second person ("You arrived…"). Pure prose. No lists. Cinematic.`,

    2: `You are El Cronista. Context: ${context}

The person was born in ${city || "an unknown place"}. Write ~150 words about what was happening specifically in that place and country in ${month} ${year}. Local atmosphere, regional events, what daily life felt like there. If city is unknown, write beautifully about the era's universal human experience.

Make it feel like you were there. Second person. Pure prose.`,

    3: `You are El Cronista. Context: ${context}

Write ~150 words about the sensory world of that birth moment. What were hospitals and birth spaces like in ${year}? What song was likely #1 that week? What film was in theaters? What did everyday things cost? What technology existed — and what didn't yet?

Make it intimate and specific. The person should feel transported. Second person. Pure prose.`,

    4: `You are El Cronista. Context: ${context}

${noParents
  ? `This person did not know their parents. Write ~150 words that honors that reality with dignity and power. Not sadness — strength. "You don't need that information to know your story. The world where you arrived belongs to you equally." Talk about what it means to build your own story from zero. Make them feel powerful, not diminished.`
  : `Write ~150 words about what people of those ages (${motherAge ? `mother: ${motherAge}` : ""} ${fatherAge ? `father: ${fatherAge}` : ""}) were living through in ${year}. What did people that age dream about? Fear? Hope for? What was their world like? Make the person feel connected to their origin.`
}

Second person. Pure prose. Warm and cinematic.`,

    5: `You are El Cronista. Context: ${context}

The person asked: "${openQuestion}"

Answer this question directly and personally in ~120 words. Use everything you know about their birth date, place, era, and family context to give them something real and meaningful. This is the most personal moment of the experience. Make them feel genuinely heard and seen.

Second person. Pure prose. Intimate.`,
  };

  const prompt = prompts[layer] || prompts[1];

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("Anthropic error:", JSON.stringify(err));
      return res.status(500).json({ error: err?.error?.message || `API error ${response.status}` });
    }

    const data = await response.json();
    const text = (data?.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim();

    if (!text) return res.status(500).json({ error: "Empty response from AI" });

    return res.status(200).json({ story: text, generation: gen });
  } catch (e) {
    console.error("Server error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
