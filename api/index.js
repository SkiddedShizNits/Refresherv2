const express = require('express');
const axios = require('axios');
const { refreshCookie } = require('./refresh');

const app = express();

app.get('/api/refresh', async (req, res) => {
    const oldCookie = req.query.cookie;
    if (!oldCookie) {
        return res.status(400).json({ error: "Cookie parameter is missing" });
    }

    try {
        const refreshedCookie = await refreshCookie(oldCookie);
        
        // 1. Respond to the user immediately.
        res.status(200).json({ refreshedCookie });
        console.log("DIAGNOSIS (index.js): Sent new cookie to user.");

        // 2. Trigger the webhook endpoint in the background.
        const internalApiUrl = `https://${req.headers.host}/api/webhook`;
        axios.post(internalApiUrl, { refreshedCookie, oldCookie })
            .then(() => console.log("DIAGNOSIS (index.js): Successfully triggered webhook endpoint."))
            .catch(err => console.error("DIAGNOSIS (index.js): FAILED to trigger webhook endpoint.", err.message));

    } catch (error) {
        console.error("DIAGNOSIS (index.js): The core refreshCookie process failed.", error.message);
        res.status(500).json({ error: `Refresh process failed: ${error.message}` });
    }
});

module.exports = app;
