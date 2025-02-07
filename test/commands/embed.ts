import { Command } from "../../src/index";

export default class EmbedCommand extends Command {
	constructor() {
		super("embed", {
			aliases: ["embed"],
			args: [
				{
					id: "emptyContent",
					match: "flag",
					flag: "-c"
				},
				{
					id: "emptyEmbed",
					match: "flag",
					flag: "-e"
				},
				{
					id: "phrase",
					match: "phrase"
				}
			]
		});
	}

	override exec(message, args) {
		if (args.emptyContent) {
			return message.util.send(null, { embed: { description: args.phrase } });
		}

		if (args.emptyEmbed) {
			return message.util.send(args.phrase, { embed: null });
		}

		return message.util.send(args.phrase, {
			embed: { description: args.phrase }
		});
	}
}
