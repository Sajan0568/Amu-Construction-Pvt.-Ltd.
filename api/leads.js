const recentSubmissions = new Map();
export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});
  const body = req.body || {};
  const name = String(body.name || '').trim(); const phone = String(body.phone || '').trim(); const requirement = String(body.requirement || '').trim(); const description = String(body.description || '').trim(); const location = String(body.location || '').trim();
  if (name.length < 2 || name.length > 100 || !/^[+\d\s().-]{7,25}$/.test(phone) || requirement.length < 2 || requirement.length > 200 || description.length < 5 || description.length > 2000 || location.length > 160) return res.status(400).json({error: 'Please provide valid lead details'});
  const now = Date.now(); const key = phone.replace(/\D/g, '');
  if (recentSubmissions.has(key) && now - recentSubmissions.get(key) < 60_000) return res.status(429).json({error: 'Please wait before sending another request'});
  recentSubmissions.set(key, now);
  // No external storage is configured yet; this validated payload is the integration point for a future CRM, email, or database.
  return res.status(200).json({ok: true});
}
