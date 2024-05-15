async function handleInteraction(interaction) {
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
}

module.exports = { handleInteraction };