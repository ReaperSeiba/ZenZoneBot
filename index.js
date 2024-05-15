const Discord = require("discord.js");
const { Client, GatewayIntentBits } = require("discord.js");
const client = new Discord.Client({
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
    try {
        await registerSlashCommands();
        const channel = client.channels.cache.get(channelId);
        channel.send("Hi! I'm alive! :3");
    } catch (error) {
        console.error("Error registering commands:", error);
    }
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    switch (commandName) {
        case "store":
            await handleStoreCommand(interaction, options);
            break;
        // Add cases for other slash commands
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
                    type: 3, // Use the integer value for STRING
                    required: true,
                },
                {
                    name: "color",
                    description: "Color of the item",
                    type: 3, // Use the integer value for STRING
                    required: true,
                },
            ],
        },
        // Add more commands as needed
    ];

    console.log("Commands registered!");

    const commandData = commands.map((command) => ({
        name: command.name,
        description: command.description,
        options: command.options,
    }));

    try {
        await client.application.commands.set(commandData);
        console.log("Slash commands registered successfully!");
    } catch (error) {
        console.error("Error registering slash commands:", error);
    }
}

// Call the registerSlashCommands function somewhere in your code
registerSlashCommands();

// Add more functions for other slash commands as needed

client.login(token);
