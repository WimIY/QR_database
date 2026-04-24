export default async function handler(req, res) {
  const { code } = req.query;
  console.log("Inkomende request voor code:", code);

  try {
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
    
    // Debug: Wat zegt Supabase letterlijk?
    console.log("Supabase antwoord:", data);

    if (!data || data.length === 0) {
      return res.status(404).json({ 
        error: 'QR code niet gevonden', 
        gezochte_code: code,
        database_data: data 
      });
    }

    const link = data[0];

    // Klik teller (met await om data-verlies te voorkomen)
    await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/qr_links?id=eq.${link.id}`,
      {
        method: 'PATCH',
        headers: {
          apikey: process.env.SUPABASE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clicks: (link.clicks || 0) + 1 })
      }
    );

    return res.redirect(302, link.target_url);
  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).send("Interne serverfout");
  }
}
