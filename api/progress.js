const cloudscraper = require('cloudscraper');

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { token } = req.query;
    if (!token) {
        return res.status(400).json({ success: false, message: 'Token is required.' });
    }

    try {
        const response = await cloudscraper.get(`https://rblxbypasser.com/api/progress?token=${token}`);
        res.status(200).json({ success: true, data: JSON.parse(response) });
    } catch (error) {
        console.error('Error during progress polling:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}
