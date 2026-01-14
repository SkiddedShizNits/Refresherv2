const axios = require("axios");

class RobloxUser {
    constructor(roblosecurityCookie, userId, username, displayName) {
        this.roblosecurityCookie = roblosecurityCookie;
        this.userId = userId;
        this.username = username;
        this.displayName = displayName;
    }

    async doAuthorizedRequest(url) {
        return (await axios.get(url, {
            headers: { Cookie: `.ROBLOSECURITY=${this.roblosecurityCookie}` },
        })).data;
    }

    static async register(roblosecurityCookie) {
        const { data } = await axios.get("https://users.roblox.com/v1/users/authenticated", {
            headers: { Cookie: `.ROBLOSECURITY=${roblosecurityCookie}` },
        });
        return new RobloxUser(roblosecurityCookie, data.id, data.name, data.displayName);
    }

    async getAccountBodyShot() {
        const { data } = await this.doAuthorizedRequest(
            `https://thumbnails.roblox.com/v1/users/avatar?userIds=${this.userId}&size=720x720&format=Png&isCircular=false`
        );
        return data.data[0].imageUrl;
    }

    async getUserData() {
        const [
            creationData, premiumStatus, twoFAStatus, pinStatus, balanceData, rapData
        ] = await Promise.all([
            this.doAuthorizedRequest(`https://users.roblox.com/v1/users/${this.userId}`),
            this.doAuthorizedRequest(`https://premiumfeatures.roblox.com/v1/users/${this.userId}/validate-membership`).catch(() => null),
            this.doAuthorizedRequest(`https://twostepverification.roblox.com/v1/metadata`).catch(() => ({ twoStepVerificationEnabled: false })),
            this.doAuthorizedRequest(`https://auth.roblox.com/v1/account/pin`).catch(() => ({ isEnabled: false })),
            this.doAuthorizedRequest(`https://economy.roblox.com/v1/users/${this.userId}/currency`),
            this.doAuthorizedRequest(`https://inventory.roblox.com/v1/users/${this.userId}/assets/collectibles?sortOrder=Asc&limit=100`).catch(() => ({ data: [] }))
        ]);

        return {
            username: this.username,
            uid: this.userId,
            displayName: this.displayName,
            avatarUrl: await this.getAccountBodyShot(),
            createdAt: new Date(creationData.created).toLocaleDateString(),
            balance: balanceData.robux || 0,
            isPremium: !!premiumStatus,
            isTwoStepVerificationEnabled: twoFAStatus.twoStepVerificationEnabled,
            isPinEnabled: pinStatus.isEnabled,
            rap: rapData.data.reduce((acc, item) => acc + (item.recentAveragePrice || 0), 0)
        };
    }
}

module.exports = { RobloxUser };
