const { Client, GatewayIntentBits, Partials, PermissionsBitField, ChannelType, SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

const VALID_COUPONS = ["FREE100", "VIP50", "WELCOME25"]; // Add your coupon codes here
const TICKET_SUPPORT_ROLE_ID = "STAFF_ROLE_ID_HERE"; // Replace with actual staff role ID

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Slash command setup
client.on("ready", async () => {
  const commands = [
    new SlashCommandBuilder()
      .setName("redeem")
      .setDescription("Redeem a coupon and open a ticket")
      .addStringOption(option =>
        option.setName("code")
          .setDescription("Enter your coupon code")
          .setRequired(true)
      )
      .toJSON()
  ];

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID), { body: commands });
  console.log("Slash command registered.");
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "redeem") {
    const code = interaction.options.getString("code").toUpperCase();
    const user = interaction.user;

    if (!VALID_COUPONS.includes(code)) {
      return interaction.reply({ content: "❌ Invalid coupon code.", ephemeral: true });
    }

    const channel = await interaction.guild.channels.create({
      name: `ticket-${user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: user.id,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
        },
        {
          id: TICKET_SUPPORT_ROLE_ID,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
        }
      ]
    });

    await channel.send({
      content: `🎫 New ticket opened by <@${user.id}>\n📦 Coupon code used: **${code}**\nPlease wait for staff to assist.`
    });

    await interaction.reply({ content: `✅ Coupon accepted. Ticket created: ${channel}`, ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);
