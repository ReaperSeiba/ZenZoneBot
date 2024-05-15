const Discord = require("discord.js");
const { Client, GatewayIntentBits } = require("discord.js");
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
    await registerSlashCommands();
    const channel = client.channels.cache.get(channelId);
    channel.send("Hi! I'm alive! :3");
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    const { commandName, options } = interaction;
    switch (commandName) {
        case "store":
            await handleStoreCommand(interaction, options);
            break;
        default:
            await interaction.reply("Invalid command.");
            break;
    }
});

async function registerSlashCommands() {
    const commands = [
        {
            name: "store",
            description: "Stores an item",
            options: [
                {
                    name: "name",
                    description: "Name of the item",
                    type: 3,
                    required: true,
                },
                {
                    name: "color",
                    description: "Color of the item",
                    type: 3,
                    required: true,
                },
            ],
        },
    ];
    const commandData = commands.map((command) => ({
        name: command.name,
        description: command.description,
        options: command.options,
    }));
    await client.application.commands.set(commandData);
}

client.login(token);
