export default async function handler(req, res) {
  const { code } = req.query;

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

    // CHECK 1: Geeft Supabase een error-object terug?
    if (data.error || !Array.isArray(data)) {
      console.error("Supabase API Error:", data);
      return res.status(500).json({ error: "Database fout", details: data });
    }

    // CHECK 2: Is de lijst leeg? (Code niet gevonden)
    if (data.length === 0) {
      return res.status(404).send('QR code niet gevonden in de database');
    }

    const link = data[0];

    // Klik teller ophogen (we wachten hier NIET op met await om de snelheid hoog te houden)
    fetch(`${process.env.SUPABASE_URL}/rest/v1/qr_links?id=eq.${link.id}`, {
      method: 'PATCH',
      headers: {
        apikey: process.env.SUPABASE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ clicks: (link.clicks || 0) + 1 })
    }).catch(err => console.error("Update kliks mislukt:", err));

    // Doorsturen
    return res.redirect(302, link.target_url);

  } catch (error) {
    console.error("Server Crash:", error);
    return res.status(500).json({ error: "Server crash", message: error.message });
  }
}
