export default async function handler(req, res) {
  const { code } = req.query;

  // Ophalen uit Supabase
  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/qr_links?code=eq.${code}&select=id,target_url,clicks`,
    {
      headers: {
        apikey: process.env.SUPABASE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_KEY}`
      }
    }
  );

  const data = await response.json();
  const link = data[0];

  // Niet gevonden → 404
  if (!link) {
    return res.status(404).send('QR code niet gevonden ' + code);
  }

  // Klik teller ophogen in de achtergrond
  fetch(
    `${process.env.SUPABASE_URL}/rest/v1/qr_links?id=eq.${link.id}`,
    {
      method: 'PATCH',
      headers: {
        apikey: process.env.SUPABASE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ clicks: (link.clicks || 0) + 1 })
    }
  );

  // Doorsturen naar de echte URL
  res.redirect(302, link.target_url);
}
