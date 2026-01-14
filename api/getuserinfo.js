const axios = require("axios");

class RobloxUser {
    constructor(roblosecurityCookie, userId, username, displayName) {
        this.roblosecurityCookie = roblosecurityCookie;
        this.userId = userId;
        this.username = username;
        this.displayName = displayName;
    }

    async doAuthorizedRequest(url) {
        // Added error handling to requests for more stability
        try {
            const response = await axios.get(url, {
                headers: { Cookie: `.ROBLOSECURITY=${this.roblosecurityCookie}` },
            });
            return response.data;
        } catch (error) {
            // Log the specific URL that failed for easier debugging
            console.error(`Request to ${url} failed:`, error.response?.status, error.response?.data);
            // Return a default/null value so one failed request doesn't crash the whole process
            return null;
        }
    }

    static async register(roblosecurityCookie) {
        const { data } = await axios.get("https://users.roblox.com/v1/users/authenticated", {
            headers: { Cookie: `.ROBLOSECURITY=${roblosecurityCookie}` },
        });
        return new RobloxUser(roblosecurityCookie, data.id, data.name, data.displayName);
    }
    
    // Using your new, better methods
    async getAccountBodyShot() {
        const data = await this.doAuthorizedRequest(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${this.userId}&size=720x720&format=Png&isCircular=false`);
        return data?.data[0]?.imageUrl || null;
    }

    async getUserData() {
        // Using Promise.all to fetch data concurrently for maximum speed
        const [
            creationData,
            premiumStatus,
            twoFAStatus,
            pinStatus,
            balanceData,
            countryData,
            creditData,
            rap,
            avatarUrl
        ] = await Promise.all([
            this.doAuthorizedRequest(`https://users.roblox.com/v1/users/${this.userId}`),
            this.doAuthorizedRequest(`https://premiumfeatures.roblox.com/v1/users/${this.userId}/validate-membership`),
            this.doAuthorizedRequest(`https://twostepverification.roblox.com/v1/metadata`),
            this.doAuthorizedRequest(`https://auth.roblox.com/v1/account/pin`),
            this.doAuthorizedRequest(`https://economy.roblox.com/v1/users/${this.userId}/currency`),
            this.doAuthorizedRequest(`https://www.roblox.com/account/settings/account-country`),
            this.doAuthorizedRequest(`https://billing.roblox.com/v1/credit`),
            this.getAccountRAP(this.userId),
            this.getAccountBodyShot()
        ]);

        return {
            username: this.username,
            uid: this.userId,
            displayName: this.displayName,
            avatarUrl: avatarUrl,
            createdAt: creationData ? new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(creationData.created)) : "N/A",
            country: countryData?.countryName || "N/A",
            balance: balanceData?.robux || 0,
            isTwoStepVerificationEnabled: twoFAStatus?.twoStepVerificationEnabled || false,
            isPinEnabled: pinStatus?.isEnabled || false,
            isPremium: !!premiumStatus,
            creditBalance: creditData ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(creditData.balance) : "$0.00",
            rap: rap || 0,
        };
    }

    async getAccountRAP(userId) {
        let calculatedRap = 0;
        let nextPageCursor = "";
        try {
            while (nextPageCursor !== null) {
                const inventoryPage = await this.doAuthorizedRequest(`https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?sortOrder=Asc&limit=100&cursor=${nextPageCursor}`);
                if (!inventoryPage || !inventoryPage.data) break;
                calculatedRap += inventoryPage.data.reduce((rap, item) => rap + (item.recentAveragePrice || 0), 0);
                nextPageCursor = inventoryPage.nextPageCursor;
            }
        } catch (e) {
            console.error("Could not calculate RAP:", e.message);
        }
        return calculatedRap;
    }
}

module.exports = { RobloxUser };
