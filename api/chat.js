const SYSTEM_PROMPT = `You are the official AI assistant for AMU Construction and Suppliers Pvt. Ltd.

Only use this approved website knowledge: AMU is a Nepal-based construction and infrastructure company based in Kaski, Nepal. Its current capabilities are building construction, road and transport infrastructure, bridge structures, and civil infrastructure. The website says the company focuses on dependable execution, practical engineering, quality workmanship, safety, clear coordination, and long-term value. Detailed project records are being prepared. Contact: 9806781536 and amuconstruction1522@gmail.com.

Never invent prices, services, projects, experience, certifications, guarantees, timelines, clients, or other company claims. Keep replies short, friendly and professional. If the answer is not in the approved knowledge, say you do not have that information and direct the visitor to contact AMU. When a visitor shows project or purchasing intent, guide them toward requesting a quote or contacting AMU.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});
  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  if (!messages.length || messages.length > 30) return res.status(400).json({error: 'Invalid conversation'});
  const safeMessages = messages.filter((message) => ['user', 'assistant'].includes(message.role) && typeof message.content === 'string').map((message) => ({role: message.role, content: message.content.slice(0, 1200)}));
  if (!safeMessages.length) return res.status(400).json({error: 'Invalid conversation'});
  if (!process.env.AI_API_KEY) return res.status(503).json({error: 'AI is not configured'});
  try {
    const aiResponse = await fetch('https://api.openai.com/v1/responses', {method: 'POST', headers: {'Content-Type': 'application/json', Authorization: `Bearer ${process.env.AI_API_KEY}`}, body: JSON.stringify({model: process.env.AI_MODEL || 'gpt-4o-mini', instructions: SYSTEM_PROMPT, input: safeMessages, max_output_tokens: 280})});
    if (!aiResponse.ok) return res.status(502).json({error: 'AI provider unavailable'});
    const data = await aiResponse.json();
    const reply = typeof data.output_text === 'string' ? data.output_text.trim() : '';
    if (!reply) return res.status(502).json({error: 'Empty AI response'});
    return res.status(200).json({reply});
  } catch { return res.status(502).json({error: 'AI provider unavailable'}); }
}
