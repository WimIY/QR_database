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
// Vervang je oude fetch(PATCH...) door dit:
fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/increment_clicks`, {
  method: 'POST',
  headers: {
    apikey: process.env.SUPABASE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ row_id: link.id })
}).catch(err => console.error("Update mislukt:", err));

    // Doorsturen
    return res.redirect(302, link.target_url);

  } catch (error) {
    console.error("Server Crash:", error);
    return res.status(500).json({ error: "Server crash", message: error.message });
  }
}
