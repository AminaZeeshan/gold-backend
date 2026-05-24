export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const currency = req.query.currency || "USD";
        const date = req.query.date || "";

        const url = date
            ? `https://www.goldapi.io/api/XAU/${currency}/${date}`
            : `https://www.goldapi.io/api/XAU/${currency}`;

        const response = await fetch(url, {
            headers: {
                "x-access-token": process.env.GOLD_API_KEY,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

      
        if (date) {
            res.setHeader('Cache-Control', 's-maxage=31536000'); 
            res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate'); 
        }

        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch gold data' });
    }
}
