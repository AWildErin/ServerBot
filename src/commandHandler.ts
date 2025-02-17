import { ChatInputCommandInteraction, ApplicationCommandOptionType } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";

type CommandExecute = (interaction: ChatInputCommandInteraction) => Promise<void>;

interface Command {
    name: string;
    description: string;
    options?: {
        name: string;
        description: string;
        type: ApplicationCommandOptionType;
        required?: boolean;
    }[];
    execute: CommandExecute;
}

const commands: Command[] = [];

export function Command(data: Omit<Command, "execute">) {
    return function (target: { execute: CommandExecute }) {
        commands.push({ ...data, execute: target.execute });
    };
}

export function getCommands(): Command[] {
    if (commands.length > 0) return commands;

    const commandsPath = join(__dirname, "commands");
    try {
        const commandFiles = readdirSync(commandsPath).filter(file => 
            file.endsWith(".ts") || file.endsWith(".js")
        );

        for (const file of commandFiles) {
            const filePath = join(commandsPath, file);
            require(filePath);
        }

        console.log(`Loaded ${commands.length} commands: ${commands.map(cmd => cmd.name).join(", ")}`);
        return commands;
    } catch (error) {
        console.error("Error loading commands:", error);
        return commands;
    }
}

export function registerCommand(command: Command) {
    if (!commands.find(cmd => cmd.name === command.name)) {
        commands.push(command);
    }
}