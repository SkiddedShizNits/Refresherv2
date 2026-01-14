const axios = require('axios');

async function getCsrfToken(cookie) {
    try {
        await axios.post("https://auth.roblox.com/v2/logout", {}, {
            headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` }
        });
        throw new Error("getCsrfToken failed - received a success response on logout, which is unexpected.");
    } catch (error) {
        const token = error.response?.headers?.['x-csrf-token'];
        if (!token) {
            console.error("CRITICAL: CSRF token was not found in the error response headers.", error.response?.headers);
            throw new Error("CSRF token not found. The cookie is likely completely invalid.");
        }
        return token;
    }
}

async function generateAuthTicket(cookie, csrfToken) {
    try {
        const response = await axios.post("https://auth.roblox.com/v1/authentication-ticket", {}, {
            headers: {
                'Cookie': `.ROBLOSECURITY=${cookie}`,
                'x-csrf-token': csrfToken,
                'Referer': 'https://www.roblox.com/games'
            }
        });
        const ticket = response.headers?.['rbx-authentication-ticket'];
        if (!ticket) {
            console.error("CRITICAL: Auth ticket not found in response headers.", response.headers);
            throw new Error("Failed to generate auth ticket. Roblox did not return one.");
        }
        return ticket;
    } catch (error) {
        console.error("CRITICAL: Axios request to generate auth ticket failed.", error.message);
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

        const cookies = response.headers?.['set-cookie'];
        if (!cookies || cookies.length === 0) {
            console.error("CRITICAL: 'set-cookie' header was missing or empty in redeem response.", response.headers);
            throw new Error("Failed to redeem ticket: Roblox did not return any new cookies.");
        }

        for (const cookie of cookies) {
            if (cookie.includes('.ROBLOSECURITY')) {
                const match = cookie.match(/\.ROBLOSECURITY=(_\|[A-Za-z0-9_|-]+)/);
                if (match && match[1]) {
                    return match[1]; // Success!
                }
            }
        }
        
        console.error("CRITICAL: Found 'set-cookie' headers, but none contained a valid .ROBLOSECURITY string.", cookies);
        throw new Error("Could not parse new cookie from headers, though headers were present.");

    } catch (error) {
        const errorMessage = error.response?.data?.errors?.[0]?.message || error.message;
        console.error("CRITICAL: Axios request to redeem ticket failed.", errorMessage);
        throw new Error(`Failed to redeem ticket: ${errorMessage}`);
    }
}

async function refreshCookie(cookie) {
    console.log("DIAGNOSIS: Starting refresh process...");
    const csrfToken = await getCsrfToken(cookie);
    console.log("DIAGNOSIS: Step 1/3 - Got CSRF token.");
    const ticket = await generateAuthTicket(cookie, csrfToken);
    console.log("DIAGNOSIS: Step 2/3 - Generated auth ticket.");
    const newCookie = await redeemAuthTicket(ticket);
    console.log("DIAGNOSIS: Step 3/3 - Successfully redeemed ticket for new cookie.");
    return newCookie;
}

module.exports = { refreshCookie };
