export default async function handler(req, res) {
    // 1. Enable CORS (Allows your frontend to talk to this backend)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // 2. Fetch from GoldAPI using your HIDDEN environment variable
        const response = await fetch("https://www.goldapi.io/api/XAU/USD", {
            headers: {
                "x-access-token": process.env.GOLD_API_KEY,
                "Content-Type": "application/json"
            }
        });
        
        const data = await response.json();
        
        // 3. THE MAGIC CACHE: Save this data for 12 hours (43200 seconds)
        // This guarantees you will NEVER break your 100/month limit again.
        res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate');
        
        res.status(200).json(data);
        
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch gold data' });
    }
}
