const Discord = require("discord.js");
const { Client, GatewayIntentBits } = require("discord.js");
const { registerSlashCommands } = require("./commands");
const { handleInteraction } = require("./eventHandlers");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});
const token = process.env["DISCORD_BOT_SECRET"];
const channelId = "1220057482475339906";

client.once("ready", async () => {
    console.log("ZenZoneBot is ready!");
    await registerSlashCommands(client);
    const channel = client.channels.cache.get(channelId);
    channel.send("Hi! I'm alive! :3");
});

client.on("interactionCreate", handleInteraction);

client.login(token);
