const axios = require('axios');

async function getCsrfToken(cookie) {
    try {
        await axios.post("https://auth.roblox.com/v2/logout", {}, {
            headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` }
        });
        return null;
    } catch (error) {
        if (error.response && error.response.headers['x-csrf-token']) {
            return error.response.headers['x-csrf-token'];
        }
        throw new Error("Failed to get CSRF token. The cookie might be expired or invalid.");
    }
}

async function generateAuthTicket(cookie, token) {
    try {
        const response = await axios.post("https://auth.roblox.com/v1/authentication-ticket", {}, {
            headers: {
                'Cookie': `.ROBLOSECURITY=${cookie}`,
                'x-csrf-token': token,
                'Referer': 'https://www.roblox.com/games'
            }
        });
        const ticket = response.headers['rbx-authentication-ticket'];
        if (!ticket) throw new Error("Authentication ticket was not found in the response.");
        return ticket;
    } catch (error) {
        throw new Error(`Failed to generate auth ticket: ${error.message}`);
    }
}

async function redeemAuthTicket(ticket) {
    try {
        const response = await axios.post("https://auth.roblox.com/v1/authentication-ticket/redeem", {
            authenticationTicket: ticket
        }, {
            headers: { 'RBXAuthenticationNegotiation': '1' }
        });

        const setCookieHeader = response.headers['set-cookie'];
        if (!setCookieHeader) throw new Error("New cookie was not found in the redemption response.");

        const newCookie = setCookieHeader[0].match(/_\|[A-Za-z0-9_|-]+/);
        if (!newCookie || !newCookie[0]) throw new Error("Could not parse the new cookie from headers.");

        return newCookie[0];
    } catch (error) {
        const errorMessage = error.response?.data?.errors?.[0]?.message || error.message;
        throw new Error(`Failed to redeem ticket: ${errorMessage}`);
    }
}

async function refreshCookie(cookie) {
    const token = await getCsrfToken(cookie);
    const ticket = await generateAuthTicket(cookie, token);
    const newCookie = await redeemAuthTicket(ticket);
    return newCookie;
}

module.exports = { refreshCookie };
