export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const currency = req.query.currency || "USD";
        const date     = req.query.date || "";

     const goldRes = await fetch("https://api.gold-api.com/price/XAU", {
            headers: { "Accept": "application/json" }
        });

        if (!goldRes.ok) throw new Error(`gold-api status: ${goldRes.status}`);

        const goldJson = await goldRes.json();
        const usdPerOz = parseFloat(goldJson.price);

        if (!usdPerOz || isNaN(usdPerOz)) throw new Error("Invalid gold price");

        // ✅ Exchange rate
        let rate = 1;
        if (currency !== "USD") {
            const fxRes  = await fetch(
                `https://api.exchangerate-api.com/v4/latest/USD`,
                { headers: { "Accept": "application/json" } }
            );
            const fxData = await fxRes.json();
            rate = fxData.rates[currency] || 1;
        }

        const price     = usdPerOz * rate;
        const gramPrice = (usdPerOz / 31.1035) * rate;

        const data = {
            price:          price,
            price_gram_24k: gramPrice,
            price_gram_22k: gramPrice * (22 / 24),
            price_gram_21k: gramPrice * (21 / 24),
            price_gram_18k: gramPrice * (18 / 24),
            high_price:     price * 1.003,
            low_price:      price * 0.997,
            currency:       currency
        };

        if (date) {
            res.setHeader('Cache-Control', 's-maxage=31536000');
        } else {
            res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate');
        }

        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({
            error:   'Failed to fetch gold data',
            details: error.message  // ← debug ke liye
        });
    }
}
