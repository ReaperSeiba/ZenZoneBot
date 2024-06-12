async function registerSlashCommands(client) {
  try {
      await client.application.commands.set([
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
      ]);
      console.log("Slash commands registered successfully!");
  } catch (error) {
      console.error("Error registering slash commands:", error);
  }
}

module.exports = { registerSlashCommands };