const Discord = require("discord.js");
const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const { arrayBuffer } = require("stream/consumers");
const channelId = "1220057482475339906"; //main channel for interacting with the bot, bot is currently not limited to this channel, just says hi here when it's alive for now and goodbye when its shut off

// TEMPORARY DATA STORAGE ===========================================
//These formats will be used for a permanent Json file.

// items is an array of objects, each object contains id#, name, description, image file path, levelUpID. ID# is its position in the items json file or temporary array storage. Example items[0] = [0, "Item Name", "Item Description", "Item Image", null]
let items = [];
//Users is an array of objects containing user number, user id, self updating username, isMod, an array of items they have, and an array of known server display names capped 3. Example users[0] = [0, true, ["Item ID", "Item ID"]]
let users = [];
// suggestions is an array of obejcts, each object contains id#, name, description, visual description
let suggestions = [];

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

//check if suggestions.json exists, if not, create it
const suggestionsFilePath = "./suggestions.json"; //file path for Suggestions.json
if (!fs.existsSync(suggestionsFilePath)) {
  const temporaryData = []; // Example JSON data
  fs.writeFileSync(suggestionsFilePath, JSON.stringify(temporaryData));
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
    console.log(arr); //logs the updated array
  } catch (error) {
    console.error(`Error writing array to ${filePath}: ${error}`);
  }
}

//function to make JSON strings more readable as discord messages

function prettifyJSON(jsonString) {
  try {
    const jsonObject = JSON.parse(jsonString);
    const prettyString = JSON.stringify(jsonObject, null, 2);
    return `\`\`\`json\n${prettyString}\n\`\`\``;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return "Error parsing JSON";
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
  suggestions = loadJsonFile(suggestionsFilePath, suggestions); //Loads suggestionsArr with data from suggestions.json

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
  " !edit", //edits a property or properties of an item, useful to reuse a removed slot
  " !view", //views the item list or up to 5 specific items
  " !remove", //removes an item, does not remove item index, also removes all instances of item from users
  " !addMod", // isMod = true;
  " !removeMod", // isMod = false;
  " !viewUser", // displays a user's information based on username, user id, or number
  " !deleteSuggestion", //removes specified suggestion based on index or name
  " !give", //gives an item to a specified user
  " !take", //takes an item from a specified user
  " !viewSuggestions", //views the suggestion list with no arguments, views specific suggestions up to 5 of them with arguments
  " !levelUp", //levels up a user's item, requires 2 arguments, user id followed by item name
];
//User Private Command List
const userPrivateCommands = [
  " !suggest", //stores a suggestion requires 3 arguments enclosed in quotes
];
//User Public Command List
const userPublicCommands = [
  " !share", //shares a specific item based on 1 argument in quotes
  " !inventory", //shares a list of all item names a user has
];

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
      if (checkModStatus(message)) {
        handleModHelpCommand(message);
      }
      break;
    case "edit":
      if (checkModStatus(message)) {
        handleEditCommand(message, args);
      }
      break;
    case "view":
      if (checkModStatus(message)) {
        handleViewCommand(message, args);
      }
      break;
    case "remove":
      if (checkModStatus(message)) {
        handleRemoveCommand(message, args);
      }
      break;
    case "addmod":
      if (checkModStatus(message)) {
        handleModStatusCommand(message, args, "addmod");
      }
      break;
    case "removemod":
      if (checkModStatus(message)) {
        handleModStatusCommand(message, args, "removemod");
      }
      break;
    case "viewuser":
      if (checkModStatus(message)) {
        handleViewUserCommand(message, args);
      }
      break;
    case "deletesuggestion":
      if (checkModStatus(message)) {
        handleDeleteSuggestionCommand(message, args);
      }
      break;
    case "give":
      if (checkModStatus(message)) {
        handleGiveCommand(message, args);
      }
      break;
    case "suggest":
      handleSuggestCommand(message, args);
      break;
    case "share":
      handleShareCommand(message, args);
      break;
    case "inventory":
      handleInventoryCommand(message);
      break;
    case "levelup":
      if (checkModStatus(message)) {
        handleLevelUpCommand(message, args);
      }
      break;
    default:
      const embed = {
        description: "Invalid command.",
        image: {
          url: "https://qph.cf2.quoracdn.net/main-qimg-0125930b81781949d403335295f19b04",
        },
      };
      message.channel.send({ embeds: [embed] });
      break;
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

function isExistingItem(identifier) {
  const lowercaseIdentifier = identifier.toLowerCase();
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (
      item.name.toLowerCase() === lowercaseIdentifier ||
      item.id === Number(identifier)
    ) {
      return { exists: true, index: i, name: item.name };
    }
  }
  return { exists: false, index: -1 }; // Return false if the item is not found
}
function isExistingSuggestion(identifier) {
  for (let i = 0; i < suggestions.length; i++) {
    const suggestion = suggestions[i];
    if (suggestion.id === identifier) {
      return { exists: true, index: i, name: suggestion.name };
    }
  }
  return { exists: false, index: -1 }; // Return false if the item is not found
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
//Function used to determine if a user is a mod
function checkModStatus(message) {
  if (!users[isExistingUser(message.author.id).index].modStatus) {
    message.channel.send("You lack the permissions to use this command.");
    return false;
  } else {
    return true;
  }
}

//helper function for share to determine if the user has the item in their inventory

function userHasItem(message, checkItem) {
  const requestedInvIndex = isExistingUser(message.author.id).index;
  const userInventory = users[requestedInvIndex].has;
  const checkItemLower =
    typeof checkItem === "object"
      ? checkItem.name.toString().toLowerCase()
      : checkItem.toLowerCase();
  return userInventory.some((item) => item.toLowerCase() === checkItemLower);
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
  // Ensure at least 3 arguments are present
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
//TODO: Update existing items in user inventory, example Namechange or convert names to index in user inventory!!
function handleEditCommand(message, args) {
  if (args.length !== 3) {
    message.channel.send(
      'Invalid command. Please provide a single item name you wish to edit, the property, and the replacement in quotes. Example: !edit "item name" "name" "new name"',
    );
    return;
  }
  const selectedItem = isExistingItem(args[0].replace(/"/g, ""));
  if (selectedItem.exists) {
    // Convert the user-provided property name to lowercase
    const propertyName = args[1].toLowerCase().replace(/"/g, "");

    // Check if the lowercase property name exists in the item object
    const itemProperties = Object.keys(items[selectedItem.index]);
    const matchingProperty = itemProperties.find(
      (prop) => prop.toLowerCase() === propertyName,
    );

    if (matchingProperty) {
      // Update the property value
      const propertyValue = args[2].replace(/"/g, "");
      items[selectedItem.index][matchingProperty] = propertyValue;
      message.channel.send(
        `Item "${args[0].replace(/"/g, "")}" edited: ${matchingProperty} = ${propertyValue}`,
      );
      writeJsonFile(itemsFilePath, items);
    } else {
      message.channel.send(
        `Invalid property: ${args[1]}. Check your spelling and try again.`,
      );
    }
  } else {
    message.channel.send(
      `Invalid item: ${args[0]}. Check your spelling and try again.`,
    );
    return;
  }
}

//views an item in memory
//Requests the json data for an item and displays it
function handleViewCommand(message, args) {
  if (args.length !== 1) {
    message.channel.send(
      'Invalid command. Please provide a single item name you wish to view in quotes. Example: !view "item name"',
    );
    return;
  }

  const selectedItem = isExistingItem(args[0].replace(/"/g, ""));
  if (selectedItem.exists) {
    const item = items[selectedItem.index];
    let itemProperties = "Properties of the item:\n";
    for (const property in item) {
      itemProperties += `${property}: ${item[property]}\n`;
    }
    message.channel.send(itemProperties);
  } else {
    message.channel.send(
      `Invalid item: ${args[0]}. Check your spelling and try again.`,
    );
  }
}

//removes an item in memory
//deletes JSON data for an item, removes it from User inventorys, leaves an undefined index to keep the numbers in order (especially important for user inventory and levelup ids)
function handleRemoveCommand(message, args) {
  if (args.length !== 1) {
    message.channel.send(
      'Invalid command. Please provide a single item name you wish to remove in quotes. Example: !remove "item name"',
    );
    return;
  }

  const selectedItem = isExistingItem(args[0].replace(/"/g, ""));
  if (selectedItem.exists) {
    // Set all properties of the removed item to blank or undefined
    const removedItem = items[selectedItem.index];
    for (const prop in removedItem) {
      removedItem[prop] = ""; // or undefined
    }

    message.channel.send(
      `Item "${args[0].replace(/"/g, "")}" removed: ${JSON.stringify(
        removedItem,
      )}`,
    );

    writeJsonFile(itemsFilePath, items);
  } else {
    message.channel.send(
      `Invalid item: ${args[0]}. Check your spelling and try again.`,
    );
  }
}

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
//views a list of all known users or a detailed view of up to 5 users
function handleViewUserCommand(message, args) {
  let userList = [];
  let notFoundList = [];
  let userMessage = ""; // Initialize an empty string to store the final message

  // Check if no users are specified to view all users
  if (args.length === 0) {
    for (let i = 0; i < users.length; i++) {
      objectString = JSON.stringify(users[i]);
      userList.push(" " + prettifyJSON(objectString));
    }
  } else if (args.length > 5) {
    // Check if too many users are requested
    message.channel.send(
      "Too many users requested. Please request a maximum of 5 users or leave arguments empty for a list of users",
    );
    return;
  } else {
    // Iterate over each argument
    for (let i = 0; i < args.length; i++) {
      // Check if the user exists
      const existingUser = isExistingUser(args[i].replace(/"/g, ""));

      // If user exists, add to userList, otherwise add to notFoundList
      if (existingUser.exists) {
        objectString = JSON.stringify(users[existingUser.index]);
        userList.push(" " + prettifyJSON(objectString));
      } else {
        notFoundList.push(args[i]);
      }
    }
  }

  // Concatenate user information into a single message
  if (userList.length > 0) {
    userMessage += `Here are the requested users:\n${userList.join("\n")}\n`; //joins the array of users into a string seperated line by line with \n
  }

  // Add users not found to the message
  if (notFoundList.length > 0) {
    userMessage += `These users could not be found: ${notFoundList.join(
      ", ",
    )}\n`;
  }

  // Send the final message
  message.channel.send(userMessage);
}

//deletes a suggestion @ index
function handleDeleteSuggestionCommand(message, args) {
  //should allow moderator to delete suggestion at index, will require looking at the suggestions json but handles the edit of the file to prevent erroring}

  if (args.length !== 1) {
    message.channel.send(
      'Invalid command. Please provide the index of the suggestion you wish to delete in quotes. Example: !deleteSuggestion "1"',
    );
    return;
  }
  const index = parseInt(args[0].replace(/"/g, ""));
  if (isExistingSuggestion(index).exists) {
    const suggestion = suggestions[isExistingSuggestion(index).index];
    suggestions.splice(isExistingSuggestion(index).index, 1);
    writeJsonFile(suggestionsFilePath, suggestions);
    message.channel.send(`Suggestion "${suggestion.name}" deleted.`);
  } else {
    message.channel.send(
      `Invalid suggestion number: ${args}. Refer to the JSON file and try again.`,
    );
  }
}
//gives an item to a user
function handleGiveCommand(message, args) {
  //needs user identification, needs item identification, and updates user inventory in users.json}
  if (args.length !== 2) {
    message.channel.send(
      'Invalid command. Please provide the username (Not display name), userID, or userIndex in quotes, and the item name or id in quotes to give an item to a user. Example "user" "1"',
    );
    return;
  }
  const userIdentifier = args[0].replace(/"/g, "");
  const itemIdentifier = args[1].replace(/"/g, "");
  console.log(userIdentifier + itemIdentifier);
  if (!isExistingUser(userIdentifier).exists) {
    message.channel.send("User not found. " + args[0]);
    return;
  }
  if (!isExistingItem(itemIdentifier).exists) {
    message.channel.send("Item not found. " + args[1]);
    return;
  }
  const selectedUser = users[isExistingUser(userIdentifier).index];
  const selectedItem = items[isExistingItem(itemIdentifier).index];
  if (selectedUser.has.includes(selectedItem.name)) {
    message.channel.send("User already has this item");
    return;
  } else {
    selectedUser.has.push(selectedItem.name);
    writeJsonFile(usersFilePath, users);
    message.channel.send(
      `Item "${selectedItem.name}" given to ${selectedUser.username}`,
    );
  }
}
//takes an item from a user
function handleTakeCommand(message, args) {
  //removes an item from a user, needs user identification, needs item identification, and updates user inventory in users.json}}
  //level up an item
}
function handleLevelUpCommand(message, args) {
  //needs user identification, needs item identification, and updates user inventory in users.json, updates using the items level up id if applicable}
}
//USER PRIVATE COMMAND AND FUNCTIONS BELOW HERE (Viewable only to user who calls) --------------------------------------------------------

//Use "!help" to display a list of user commands
function handleHelpCommand(message) {
  message.channel.send(
    `Hi here is a list of all private commands with responses visible only to you: ${userPrivateCommands} and here is a list of all public commands visible to others ${userPublicCommands}`,
  );
}

//Use !suggest to suggest an item (requires 3 arguments)
function handleSuggestCommand(message, args) {
  // Ensure at least 3 arguments are present
  if (args.length >= 3) {
    if (suggestions.length > 0) {
      idNum = suggestions[suggestions.length - 1].id + 1;
    } else {
      idNum = 1;
    }
    const newSuggestion = {
      id: idNum, //ID will count up from 1 rather than 0
      name: args[0].replace(/"/g, ""),
      description: args[1].replace(/"/g, ""),
      visualDescription: args[2].replace(/"/g, ""),
    };
    suggestions.push(newSuggestion);
    message.channel.send(`Elements stored: ${args.join(", ")} @ ${idNum}`);
    writeJsonFile(suggestionsFilePath, suggestions);
    console.log("suggestions wrote to file");
  } else {
    message.channel.send(
      "Invalid command. Please provide the 3 required elements (Name, Description, Visual Description) enclosed in quotes.",
    );
  }
}

//USER PUBLIC COMMAND AND FUNCTIONS BELOW HERE (Viewable to all in server) ---------------------------------------------------------

//Use !share to share an item publicly
function handleShareCommand(message, args) {
  if (args.length !== 1) {
    message.channel.send(
      "Please provide exactly one argument: the name of the item you want to share in quotes.",
    );
    return;
  }
  const itemName = args[0].replace(/"/g, "").toLowerCase();
  const itemToShare = isExistingItem(itemName); // Remove quotes and convert to lowercase and pulls item from list if it exists

  if (itemToShare.exists) {
    if (!userHasItem(message, itemToShare)) {
      message.channel.send(
        itemToShare.name +
          " exists but is not in your inventory. Maybe you will have it someday! :3",
      );
    } else {
      const itemString = prettifyJSON(JSON.stringify(items[itemToShare.index]));
      message.channel.send(
        `Here is the information for the item "${itemToShare.name}":\n${itemString}`,
      );
    }
  } else {
    if (userHasItem(message, itemName)) {
      message.channel.send(
        `Oops ${args[0]} not found in the masterlist but it is in your inventory. Please report this to the moderators.`,
      );
      return;
    }
    message.channel.send(
      `${args[0]} does not exist. Please check your spelling or if you'd like to suggest a new item use !suggest.`,
    );
  }
}

//Use !inventory to view your inventory
function handleInventoryCommand(message) {
  let requestedInv = isExistingUser(message.author.id).index;
  if (users[requestedInv].has.length === 0) {
    message.channel.send("You have no items in your inventory"); //displays a message if the user has no items in their inventory
  } else {
    message.channel.send(
      `Here is your inventory: ${users[requestedInv].has.join(", ")}`, //displays users inventory
    );
  }
}

client.login(token);
