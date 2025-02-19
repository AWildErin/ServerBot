import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from "discord.js";
import { Command } from "../commandHandler";
import prisma from "../database";

@Command({
    name: "send",
    description: "Send an amount of money to another user.",
    options: [
        {
            name: "user",
            description: "The user to send money to.",
            type: 6,
            required: true,
        },
        {
            name: "amount",
            description: "The amount of money to send.",
            type: 4,
            required: true,
        }
    ]
})
export class SendCommand {
    static async execute(interaction: ChatInputCommandInteraction) {
        const amount = interaction.options.getInteger("amount");
        const targetUser = interaction.options.getUser("user");

        if (!targetUser) {
            await interaction.reply({
                content: "Please specify a valid user to send money to.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        if (!amount) {
            await interaction.reply({
                content: "You must specify an amount to send!",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        if (amount <= 0) {
            await interaction.reply({
                content: "Amount must be greater than 0.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        if (targetUser.id === interaction.user.id) {
            await interaction.reply({
                content: "You cannot send money to yourself!",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const sender = await prisma.user.findUnique({
            where: { discordId: interaction.user.id },
        });

        if (!sender) {
            await interaction.reply({
                content: "You don't have an account yet!",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const recipient = await prisma.user.findUnique({
            where: { discordId: targetUser.id },
        });

        if (!recipient) {
            await interaction.reply({
                content: "The recipient doesn't have an account yet!",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        if (sender.balance < amount) {
            await interaction.reply({
                content: "You do not have enough money to send.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }
        
        await prisma.$transaction([
            prisma.user.update({
                where: { discordId: sender.discordId },
                data: { balance: sender.balance - amount },
            }),
            prisma.user.update({
                where: { discordId: recipient.discordId },
                data: { balance: recipient.balance + amount },
            })
        ]);

        const embed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle("💸 Money Sent 💸")
            .setDescription(`You sent ${amount}$ to ${targetUser.username}.`)
            .addFields(
                { name: "Your New Balance", value: `${sender.balance - amount}$`, inline: true },
                { name: "Recipient's New Balance", value: `${recipient.balance + amount}$`, inline: true },
            );

        await interaction.reply({ embeds: [embed] });
    }
}