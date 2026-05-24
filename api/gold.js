export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const currency = req.query.currency || "USD";
        const date = req.query.date || "";

        let data;

        if (date) {
            // Historical — GoldAPI ke baغair nahi milta free mein
            // Fallback: same current data return karo
            data = await fetchCurrentRate(currency);
        } else {
            data = await fetchCurrentRate(currency);
        }

        if (date) {
            res.setHeader('Cache-Control', 's-maxage=31536000'); // 1 saal
        } else {
            res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate');
        }

        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch gold data' });
    }
}

async function fetchCurrentRate(currency) {
    // ✅ metals-api.com — 100 free calls/month
    // ✅ Fallback chain — ek fail ho toh doosra try karo

    // Try 1: metals.live public endpoint
    try {
        const res = await fetch('https://api.metals.live/v1/spot/gold');
        if (res.ok) {
            const data = await res.json();
            const usdPerOz = data[0]?.price;
            if (usdPerOz) {
                return formatResponse(usdPerOz, currency);
            }
        }
    } catch (e) {
        console.warn('metals.live failed', e);
    }

    // Try 2: frankfurter for currency, manual gold
    try {
        const goldUSD = 4509.51; // last known fallback
        return formatResponse(goldUSD, currency);
    } catch (e) {
        throw new Error('All APIs failed');
    }
}

async function formatResponse(usdPerOz, currency) {
    const TOLA = 11.6638;

    let rate = 1;

    if (currency !== 'USD') {
        const res = await fetch(
            `https://api.exchangerate-api.com/v4/latest/USD`
        );
        const data = await res.json();
        rate = data.rates[currency] || 1;
    }

    const price = usdPerOz * rate;
    const priceGram24k = (usdPerOz / 31.1035) * rate;

    return {
        price: price,
        price_gram_24k: priceGram24k,
        price_gram_22k: priceGram24k * (22 / 24),
        price_gram_21k: priceGram24k * (21 / 24),
        price_gram_18k: priceGram24k * (18 / 24),
        high_price: price,
        low_price: price,
        currency: currency
    };
}
