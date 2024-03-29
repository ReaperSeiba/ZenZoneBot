const Discord = require("discord.js");
const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

// TEMPORARY DATA STORAGE ===========================================
//These formats will be used for a permanent Json file.

// items is an array of objects, each aobject contains id#, name, description, image file path, levelUpID. ID# is its position in the items json file or temporary array storage. Example items[0] = [0, "Item Name", "Item Description", "Item Image", null]
let items = [];
//Users is an array of objects containing user number, user id, self updating username, isMod, an array of items they have, and an array of known server display names capped 3. Example users[0] = [0, true, ["Item ID", "Item ID"]]
let users = [];

//JSON FUNCTIONS ====================================================

//Check if items.json exists, if not, create it
const itemsFilePath = "./items.json"; //file path for Items.json
if (!fs.existsSync(itemsFilePath)) {
  const temporaryData = []; // Example JSON data
  fs.writeFileSync(itemsFilePath, JSON.stringify(temporaryData));
}

// Check if users.json exists, if not, create it
const usersFilePath = "./users.json"; //file path for Users.json
if (!fs.existsSync(usersFilePath)) {
  const temporaryData = []; // Example JSON data
  fs.writeFileSync(usersFilePath, JSON.stringify(temporaryData));
}

//function to sync an array with a JSON file
function loadJsonFile(filePath, arr) {
  if (fs.existsSync(filePath)) {
    const fileData = fs.readFileSync(filePath, "utf-8");
    arr = JSON.parse(fileData);
    return arr;
  }
}

//function to write Data into the json files
function writeJsonFile(filePath, arr) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(arr, null, 2));
    console.log(users); //logs the updated user list
    console.log(items); //logs the updated item list
  } catch (error) {
    console.error(`Error writing array to ${filePath}: ${error}`);
  }
}

const client = new Discord.Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const prefix = "!"; // Your bot's prefix
const token = process.env["DISCORD_BOT_SECRET"];

//runs once at bot startup!
client.on("ready", () => {
  console.log("ZenZoneBot is a ready to go Captain!");
  console.log("My current user name is : " + client.user.username);
  items = loadJsonFile(itemsFilePath, items); //Loads itemsArr with data from items.json
  users = loadJsonFile(usersFilePath, users); //Loads usersArr with data from users.json

  const channelId = "1220057482475339906";
  const channel = client.channels.cache.get(channelId);

  // Check if the channel exists
  if (!channel) {
    console.log("Channel not found.");
    return;
  }

  // Send a message to the channel
  channel.send("Hi! I'm alive! :3");
});

//Command lists for Help functions ======================================================================

//Moderator Command List
const modCommands = [
  " !store", //stores an item requires 4 arguments enclosed in quotes
  " !edit",
  " !view",
  " !remove",
  " !addMod", // isMod = true;
  " !removeMod", // isMod = false;
  " !viewMod",
  " !deleteSuggestion",
  " !give",
  " !levelUp",
];
//User Private Command List
const userPrivateCommands = [" !suggest"];
//User Public Command List
const userPublicCommands = [" !share", " !inventory"];

//BOT REQUIRED FUNCTIONS BELOW HERE===========================================================================

//BOT  LISTENING CODE BLOCK
client.on("messageCreate", (message) => {
  let botIsAuthor = message.author.bot ? true : false; //true if bot is nauthor and false if bot is not author
  if (botIsAuthor) {
    console.log("A bot tried to join the fun, bad bot!");
    return;
  }

  //Add new user to the user list or updates user display name if user exists
  const existingUser = isExistingUser(message.author.id);
  if (existingUser.exists) {
    updateExistingUser(existingUser.index, message);
  } else {
    addNewUser(message);
  }

  //checks if the message starts with the prefix to determine if it's a command
  if (!message.content.startsWith(prefix)) {
    return;
  }

  // Extract command and arguments
  const { command, args } = parseCommand(
    message.content.slice(prefix.length).trim(),
  );

  // Log command and arguments
  console.log("Command:", command);
  console.log("Arguments:", args);

  // INSERT MOD WHITELIST CHECK HERE!!!
  runCommand(command, message, args);
});

// FUNCTION THAT PARSES INPUT INTO LOWERCASE COMMANDS AND DETERMINES ARGUMENTS BASED ON "".
function parseCommand(content) {
  const parts = content.match(/"([^"]+)"|\S+/g) || []; // Match quoted and unquoted parts
  const command = parts.shift().toLowerCase(); // Extract and lowercase the command
  const args = parts.filter((arg) => arg.startsWith('"') && arg.endsWith('"')); // Filter only quoted arguments
  return { command, args };
}

// SWITCH STATEMENT THAT RUNS COMMANDS BASED ON COMMAND NAME PARSED FROM parseCommand().
function runCommand(command, message, args) {
  switch (command) {
    case "store":
      if (checkModStatus(message)) {
        handleStoreCommand(message, args);
      }
      break;
    case "help":
      handleHelpCommand(message);
      break;
    case "modhelp":
      handleModHelpCommand(message);
      break;
    case "edit":
      handleEditCommand(message, args);
      break;
    case "view":
      handleViewCommand(message, args);
      break;
    case "remove":
      handleRemoveCommand(message, args);
      break;
    case "addmod":
      handleModStatusCommand(message, args, "addmod");
      break;
    case "removemod":
      handleModStatusCommand(message, args, "removemod");
      break;
    case "viewmod":
      handleViewModCommand(message);
      break;
    case "deletesuggestion":
      handleDeleteSuggestionCommand(message);
      break;
    case "give":
      handleGiveCommand(message);
      break;
    case "suggest":
      handleSuggestCommand(message);
      break;
    case "share":
      handleShareCommand(message);
      break;
    case "inventory":
      handleInventoryCommand(message);
      break;
    case "levelup":
      handleLevelUpCommand(message);
      break;
    default:
      
      const embed = new Discord.MessageEmbed()
        .setDescription('Invalid command.')
        .setImage('https://qph.cf2.quoracdn.net/main-qimg-0125930b81781949d403335295f19b04');

      message.channel.send({ embeds: [embed] });
      break; // Add a break statement here to exit the default case block
  }
}
//Creates a new user object and saves it to memory
function addNewUser(message) {
  const newUser = {
    index: users.length,
    userID: message.author.id,
    username: message.author.username,
    modStatus: false,
    has: [],
    displayname: [
      message.guild.members.cache.get(message.author.id).displayName,
    ],
  };
  users.push(newUser);
  writeJsonFile(usersFilePath, users);
}

// Function to check if a user exists and return its index if found
function isExistingUser(identifier) {
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (
      user.userID === identifier ||
      user.username === identifier ||
      user.index === Number(identifier)
    ) {
      return { exists: true, index: i };
    }
  }
  return { exists: false, index: -1 }; // Return false if the user is not found
}

// Function to update an existing user's information
function updateExistingUser(userID, message) {
  let currentDisplayName = message.guild.members.cache.get(
    message.author.id,
  ).displayName;
  let username = message.author.username;
  const user = users.find((user) => user.userID === userID);
  if (user) {
    user.username = username;
    if (!user.displayname.includes(currentDisplayName)) {
      user.displayname.unshift(currentDisplayName);
      if (user.displayname.length > 3) {
        user.displayname.pop();
      }
    }
  }
}
function checkModStatus(message) {
  if (!users[isExistingUser(message.author.id).index].modStatus) {
    message.channel.send("You lack the permissions to use this command.");
    return false;
  } else {
    return true;
  }
}

function embedImage(imagePath) {}

//COMMAND FUNCTIONS BELOW HERE ====================================================================

//MODERATOR COMMANDS Viewable only to the moderator who calls OR viewable only in a specific channel? -------------------------------------
// displays a list of Mod only commands
function handleModHelpCommand(message) {
  message.channel.send(
    `Hi here is a list of all moderator commands: ${modCommands}`,
  );
}
//stores a new item in memory with 4 arguments
function handleStoreCommand(message, args) {
  // Ensure at least 4 arguments are present
  if (args.length >= 4) {
    const newItem = {
      id: items.length + 1, //ID will count up from 1 rather than 0
      name: args[0].replace(/"/g, ""),
      description: args[1].replace(/"/g, ""),
      image: args[2].replace(/"/g, ""),
      levelUpID: args[3].replace(/"/g, ""),
    };
    items.push(newItem);
    message.channel.send(
      `Elements stored: ${args.join(", ")} @ ${items.length}`,
    );
    writeJsonFile(itemsFilePath, items);
  } else {
    message.channel.send(
      "Invalid command. Please provide the 4 required elements (Name, Description, Image, LevelUpID) enclosed in quotes.",
    );
  }
}
//edits an item in memory
function handleEditCommand(message) {}
//views an item in memory
function handleViewCommand(message) {}
//removes an item in memory
function handleRemoveCommand(message) {}
//used in both remove and add mod to change moderator status
function handleModStatusCommand(message, args, command) {
  if (args.length < 1) {
    message.channel.send(
      "Invalid command. Please provide the username (Not display name), userID, or userIndex in quotes.",
    );
    return;
  }
  const identifier = args[0].replace(/"/g, "");
  const userArgs = isExistingUser(identifier);
  if (!userArgs.exists) {
    message.channel.send("User not found. " + args[0]);
    return;
  }

  const selectedUser = users[userArgs.index];
  // const modStatus = users[userIndex][3];

  switch (command) {
    case "addmod":
      if (!selectedUser.modStatus) {
        selectedUser.modStatus = true;
        writeJsonFile(usersFilePath, users);
        message.channel.send(`${selectedUser.username} is now a moderator!`);
      } else {
        message.channel.send(
          `${selectedUser.username} is already a moderator!`,
        );
      }
      break;

    case "removemod":
      if (selectedUser.modStatus) {
        selectedUser.modStatus = false;
        writeJsonFile(usersFilePath, users);
        message.channel.send(
          `${selectedUser.username} is no longer a moderator!`,
        );
      } else {
        message.channel.send(`${selectedUser.username} was not a moderator!`);
      }
      break;

    default:
      message.channel.send("Invalid command.");
  }
}
//views moderator list
function handleViewModCommand(message) {}
//deletes a suggestion @ index
function handleDeleteSuggestionCommand(message) {}
//gives an item to a user
function handleGiveCommand(message) {}
//level up an item
function handleLevelUpCommand(message) {}

//USER PRIVATE COMMAND AND FUNCTIONS BELOW HERE (Viewable only to user who calls) --------------------------------------------------------

//Use "!help" to display a list of user commands
function handleHelpCommand(message) {
  message.channel.send(
    `Hi here is a list of all private commands with responses visible only to you: ${userPrivateCommands} and here is a list of all public commands visible to others ${userPublicCommands}`,
  );
}

//Use !suggest to suggest an item (requires 4 arguments)
function handleSuggestCommand(message, args) {}

//USER PUBLIC COMMAND AND FUNCTIONS BELOW HERE (Viewable to all in server) ---------------------------------------------------------

//Use !share to share an item publicly
function handleShareCommand(message) {}
//Use ! inventory to view your inventory
function handleInventoryCommand(message) {}

client.login(token);
