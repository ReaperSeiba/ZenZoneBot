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

    const { commandName } = interaction;

    switch (commandName) {
        case "store":
            await handleStoreCommand(interaction);
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
            // Add more commands as needed
        },
        // Add more commands as needed
    ];
    console.log("Commands registered!");

    const commandData = commands.map((command) => ({
        name: command.name,
        description: command.description,
    }));

    console.log(commandData);

    await client.application.commands.set(commandData);
}

async function handleStoreCommand(interaction) {
    // Your store command logic here
    await interaction.reply("Store command executed.");
}

// Add more functions for other slash commands as needed

client.login(token);
