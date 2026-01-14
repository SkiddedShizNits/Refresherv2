const axios = require("axios");

class RobloxUser {
    constructor(roblosecurityCookie, userId, username, displayName) {
        this.roblosecurityCookie = roblosecurityCookie; this.userId = userId; this.username = username; this.displayName = displayName;
    }
    async doAuthorizedRequest(url) {
        try {
            return (await axios.get(url, { headers: { Cookie: `.ROBLOSECURITY=${this.roblosecurityCookie}` } })).data;
        } catch (error) {
            console.warn(`Request to ${url} failed. This might be okay.`, error.response?.status); return null;
        }
    }
    static async register(roblosecurityCookie) {
        const { data } = await axios.get("https://users.roblox.com/v1/users/authenticated", { headers: { Cookie: `.ROBLOSECURITY=${roblosecurityCookie}` } });
        return new RobloxUser(roblosecurityCookie, data.id, data.name, data.displayName);
    }
    async getAccountBodyShot() {
        const d = await this.doAuthorizedRequest(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${this.userId}&size=720x720&format=Png&isCircular=false`);
        return d?.data[0]?.imageUrl || null;
    }
    async getAccountRAP(userId) {
        let rap = 0, cursor = "";
        try {
            do {
                const page = await this.doAuthorizedRequest(`https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?sortOrder=Asc&limit=100&cursor=${cursor}`);
                if (!page?.data) break;
                rap += page.data.reduce((acc, item) => acc + (item.recentAveragePrice || 0), 0);
                cursor = page.nextPageCursor;
            } while (cursor);
        } catch (e) { console.error("Could not calculate RAP.", e.message); }
        return rap;
    }
    async getUserData() {
        const [creationData, premiumStatus, twoFAStatus, pinStatus, balanceData, countryData, creditData, rap, avatarUrl] = await Promise.all([
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
            username: this.username, uid: this.userId, displayName: this.displayName, avatarUrl: avatarUrl,
            createdAt: creationData ? new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(creationData.created)) : "N/A",
            country: countryData?.countryName || "N/A", balance: balanceData?.robux || 0,
            isTwoStepVerificationEnabled: !!twoFAStatus?.twoStepVerificationEnabled, isPinEnabled: !!pinStatus?.isEnabled, isPremium: !!premiumStatus,
            creditBalance: creditData ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(creditData.balance) : "$0.00", rap: rap || 0,
        };
    }
}
module.exports = { RobloxUser };
