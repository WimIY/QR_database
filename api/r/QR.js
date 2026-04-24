// api/r/[code].js
export default async function handler(req, res) {
  const { code } = req.query;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/qr_links?code=eq.${code}&select=target_url,id`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  const [link] = await response.json();

  if (!link) return res.status(404).send('Niet gevonden');

  // klik teller verhogen
  await fetch(`${SUPABASE_URL}/rest/v1/qr_links?id=eq.${link.id}`, {
    method: 'PATCH',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ clicks: link.clicks + 1 })
  });

  res.redirect(302, link.target_url);
}
