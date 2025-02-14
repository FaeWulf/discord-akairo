import {
	BaseGuildVoiceChannel,
	BufferResolvable,
	Collection,
	Emoji,
	Guild,
	GuildMember,
	MessageAttachment,
	MessageEmbed,
	MessageEmbedOptions,
	Permissions,
	Role,
	Snowflake,
	User
} from "discord.js";
import { Stream } from "stream";
import { GuildTextBasedChannels } from "../typings/guildTextBasedChannels";
import AkairoClient from "./AkairoClient";

/**
 * Client utilities to help with common tasks.
 * @param {AkairoClient} client - The client.
 */
export default class ClientUtil {
	public constructor(client: AkairoClient) {
		this.client = client;
	}

	/**
	 * The Akairo client.
	 */
	public readonly client: AkairoClient;

	/**
	 * Makes a MessageAttachment.
	 * @param file - The file.
	 * @param name - The filename.
	 */
	public attachment(file: BufferResolvable | Stream, name?: string): MessageAttachment {
		return new MessageAttachment(file, name);
	}

	/**
	 * Checks if a string could be referring to a channel.
	 * @param text - Text to check.
	 * @param channel - Channel to check.
	 * @param caseSensitive - Makes checking by name case sensitive.
	 * @param wholeWord - Makes checking by name match full word only.
	 */
	public checkChannel(
		text: string,
		channel: GuildTextBasedChannels | BaseGuildVoiceChannel,
		caseSensitive = false,
		wholeWord = false
	): boolean {
		if (channel.id === text) return true;

		const reg = /<#(\d{17,19})>/;
		const match = text.match(reg);

		if (match && channel.id === match[1]) return true;

		text = caseSensitive ? text : text.toLowerCase();
		const name = caseSensitive ? channel.name : channel.name.toLowerCase();

		if (!wholeWord) {
			return name.includes(text) || name.includes(text.replace(/^#/, ""));
		}

		return name === text || name === text.replace(/^#/, "");
	}

	/**
	 * Checks if a string could be referring to a emoji.
	 * @param text - Text to check.
	 * @param emoji - Emoji to check.
	 * @param caseSensitive - Makes checking by name case sensitive.
	 * @param wholeWord - Makes checking by name match full word only.
	 */
	public checkEmoji(text: string, emoji: Emoji, caseSensitive = false, wholeWord = false): boolean {
		if (emoji.id === text) return true;

		const reg = /<a?:[a-zA-Z0-9_]+:(\d{17,19})>/;
		const match = text.match(reg);

		if (match && emoji.id === match[1]) return true;

		text = caseSensitive ? text : text.toLowerCase();
		const name = caseSensitive ? emoji.name : emoji.name?.toLowerCase();

		if (!wholeWord) {
			return name.includes(text) || name.includes(text.replace(/:/, ""));
		}

		return name === text || name === text.replace(/:/, "");
	}

	/**
	 * Checks if a string could be referring to a guild.
	 * @param text - Text to check.
	 * @param guild - Guild to check.
	 * @param caseSensitive - Makes checking by name case sensitive.
	 * @param wholeWord - Makes checking by name match full word only.
	 */
	public checkGuild(text: string, guild: Guild, caseSensitive = false, wholeWord = false): boolean {
		if (guild.id === text) return true;

		text = caseSensitive ? text : text.toLowerCase();
		const name = caseSensitive ? guild.name : guild.name.toLowerCase();

		if (!wholeWord) return name.includes(text);
		return name === text;
	}

	/**
	 * Checks if a string could be referring to a member.
	 * @param text - Text to check.
	 * @param member - Member to check.
	 * @param caseSensitive - Makes checking by name case sensitive.
	 * @param wholeWord - Makes checking by name match full word only.
	 */
	public checkMember(text: string, member: GuildMember, caseSensitive = false, wholeWord = false): boolean {
		if (member.id === text) return true;

		const reg = /<@!?(\d{17,19})>/;
		const match = text.match(reg);

		if (match && member.id === match[1]) return true;

		text = caseSensitive ? text : text.toLowerCase();
		const username = caseSensitive ? member.user.username : member.user.username.toLowerCase();
		const displayName = caseSensitive ? member.displayName : member.displayName.toLowerCase();
		const discrim = member.user.discriminator;

		if (!wholeWord) {
			return (
				displayName.includes(text) ||
				username.includes(text) ||
				((username.includes(text.split("#")[0]) || displayName.includes(text.split("#")[0])) &&
					discrim.includes(text.split("#")[1]))
			);
		}

		return (
			displayName === text ||
			username === text ||
			((username === text.split("#")[0] || displayName === text.split("#")[0]) && discrim === text.split("#")[1])
		);
	}

	/**
	 * Checks if a string could be referring to a role.
	 * @param text - Text to check.
	 * @param role - Role to check.
	 * @param caseSensitive - Makes checking by name case sensitive.
	 * @param wholeWord - Makes checking by name match full word only.
	 */
	public checkRole(text: string, role: Role, caseSensitive = false, wholeWord = false): boolean {
		if (role.id === text) return true;

		const reg = /<@&(\d{17,19})>/;
		const match = text.match(reg);

		if (match && role.id === match[1]) return true;

		text = caseSensitive ? text : text.toLowerCase();
		const name = caseSensitive ? role.name : role.name.toLowerCase();

		if (!wholeWord) {
			return name.includes(text) || name.includes(text.replace(/^@/, ""));
		}

		return name === text || name === text.replace(/^@/, "");
	}

	/**
	 * Resolves a user from a string, such as an ID, a name, or a mention.
	 * @param text - Text to resolve.
	 * @param users - Collection of users to find in.
	 * @param caseSensitive - Makes finding by name case sensitive.
	 * @param wholeWord - Makes finding by name match full word only.
	 */
	public checkUser(text: string, user: User, caseSensitive = false, wholeWord = false): boolean {
		if (user.id === text) return true;

		const reg = /<@!?(\d{17,19})>/;
		const match = text.match(reg);

		if (match && user.id === match[1]) return true;

		text = caseSensitive ? text : text.toLowerCase();
		const username = caseSensitive ? user.username : user.username.toLowerCase();
		const discrim = user.discriminator;

		if (!wholeWord) {
			return username.includes(text) || (username.includes(text.split("#")[0]) && discrim.includes(text.split("#")[1]));
		}

		return username === text || (username === text.split("#")[0] && discrim === text.split("#")[1]);
	}

	/**
	 * Makes a Collection.
	 * @param iterable - Entries to fill with.
	 */
	public collection<K, V>(iterable?: ReadonlyArray<readonly [K, V]> | null): Collection<K, V> {
		return new Collection(iterable);
	}

	/**
	 * Compares two member objects presences and checks if they stopped or started a stream or not.
	 * Returns `0`, `1`, or `2` for no change, stopped, or started.
	 * @param oldMember - The old member.
	 * @param newMember - The new member.
	 */
	public compareStreaming(oldMember: GuildMember, newMember: GuildMember): 0 | 1 | 2 {
		const s1 = oldMember.presence?.activities.find(c => c.type === "STREAMING");
		const s2 = newMember.presence?.activities.find(c => c.type === "STREAMING");
		if (s1 === s2) return 0;
		if (s1) return 1;
		if (s2) return 2;
		return 0;
	}

	/**
	 * Makes a MessageEmbed.
	 * @param data - Embed data.
	 */
	public embed(data: MessageEmbed | MessageEmbedOptions): MessageEmbed {
		return new MessageEmbed(data);
	}

	/**
	 * Combination of `<Client>.fetchUser()` and `<Guild>.fetchMember()`.
	 * @param guild - Guild to fetch in.
	 * @param id - ID of the user.
	 * @param cache - Whether or not to add to cache.
	 */
	public async fetchMember(guild: Guild, id: Snowflake, cache: boolean): Promise<GuildMember> {
		const user = await this.client.users.fetch(id, { cache });
		return guild.members.fetch({ user, cache });
	}

	/**
	 * Array of permission names.
	 */
	public permissionNames(): string[] {
		return Object.keys(Permissions.FLAGS);
	}

	/**
	 * Resolves a channel from a string, such as an ID, a name, or a mention.
	 * @param text - Text to resolve.
	 * @param channels - Collection of channels to find in.
	 * @param caseSensitive - Makes finding by name case sensitive.
	 * @param wholeWord - Makes finding by name match full word only.
	 */
	public resolveChannel(
		text: string,
		channels: Collection<Snowflake, GuildTextBasedChannels | BaseGuildVoiceChannel>,
		caseSensitive = false,
		wholeWord = false
	): GuildTextBasedChannels | BaseGuildVoiceChannel {
		return (
			channels.get(text as Snowflake) ||
			channels.find(channel => this.checkChannel(text, channel, caseSensitive, wholeWord))
		);
	}

	/**
	 * Resolves multiple channels from a string, such as an ID, a name, or a mention.
	 * @param text - Text to resolve.
	 * @param channels - Collection of channels to find in.
	 * @param caseSensitive - Makes finding by name case sensitive.
	 * @param wholeWord - Makes finding by name match full word only.
	 */
	public resolveChannels(
		text: string,
		channels: Collection<Snowflake, GuildTextBasedChannels | BaseGuildVoiceChannel>,
		caseSensitive = false,
		wholeWord = false
	): Collection<Snowflake, GuildTextBasedChannels | BaseGuildVoiceChannel> {
		return channels.filter(channel => this.checkChannel(text, channel, caseSensitive, wholeWord));
	}

	/**
	 * Resolves a custom emoji from a string, such as a name or a mention.
	 * @param text - Text to resolve.
	 * @param emojis - Collection of emojis to find in.
	 * @param caseSensitive - Makes finding by name case sensitive.
	 * @param wholeWord - Makes finding by name match full word only.
	 */
	public resolveEmoji(
		text: string,
		emojis: Collection<Snowflake, Emoji>,
		caseSensitive = false,
		wholeWord = false
	): Emoji {
		return (
			emojis.get(text as Snowflake) || emojis.find(emoji => this.checkEmoji(text, emoji, caseSensitive, wholeWord))
		);
	}

	/**
	 * Resolves multiple custom emojis from a string, such as a name or a mention.
	 * @param text - Text to resolve.
	 * @param emojis - Collection of emojis to find in.
	 * @param caseSensitive - Makes finding by name case sensitive.
	 * @param wholeWord - Makes finding by name match full word only.
	 */
	public resolveEmojis(
		text: string,
		emojis: Collection<Snowflake, Emoji>,
		caseSensitive = false,
		wholeWord = false
	): Collection<Snowflake, Emoji> {
		return emojis.filter(emoji => this.checkEmoji(text, emoji, caseSensitive, wholeWord));
	}

	/**
	 * Resolves a guild from a string, such as an ID or a name.
	 * @param text - Text to resolve.
	 * @param guilds - Collection of guilds to find in.
	 * @param caseSensitive - Makes finding by name case sensitive.
	 * @param wholeWord - Makes finding by name match full word only.
	 */
	public resolveGuild(
		text: string,
		guilds: Collection<Snowflake, Guild>,
		caseSensitive = false,
		wholeWord = false
	): Guild {
		return (
			guilds.get(text as Snowflake) || guilds.find(guild => this.checkGuild(text, guild, caseSensitive, wholeWord))
		);
	}

	/**
	 * Resolves multiple guilds from a string, such as an ID or a name.
	 * @param text - Text to resolve.
	 * @param guilds - Collection of guilds to find in.
	 * @param caseSensitive - Makes finding by name case sensitive.
	 * @param wholeWord - Makes finding by name match full word only.
	 */
	public resolveGuilds(
		text: string,
		guilds: Collection<Snowflake, Guild>,
		caseSensitive = false,
		wholeWord = false
	): Collection<Snowflake, Guild> {
		return guilds.filter(guild => this.checkGuild(text, guild, caseSensitive, wholeWord));
	}

	/**
	 * Resolves a member from a string, such as an ID, a name, or a mention.
	 * @param text - Text to resolve.
	 * @param members - Collection of members to find in.
	 * @param caseSensitive - Makes finding by name case sensitive.
	 * @param wholeWord - Makes finding by name match full word only.
	 */
	resolveMember(
		text: string,
		members: Collection<Snowflake, GuildMember>,
		caseSensitive = false,
		wholeWord = false
	): GuildMember {
		return (
			members.get(text as Snowflake) || members.find(member => this.checkMember(text, member, caseSensitive, wholeWord))
		);
	}

	/**
	 * Resolves multiple members from a string, such as an ID, a name, or a mention.
	 * @param text - Text to resolve.
	 * @param members - Collection of members to find in.
	 * @param caseSensitive - Makes finding by name case sensitive.
	 * @param wholeWord - Makes finding by name match full word only.
	 */
	resolveMembers(
		text: string,
		members: Collection<Snowflake, GuildMember>,
		caseSensitive = false,
		wholeWord = false
	): Collection<Snowflake, GuildMember> {
		return members.filter(member => this.checkMember(text, member, caseSensitive, wholeWord));
	}

	/**
	 * Resolves a permission number and returns an array of permission names.
	 * @param number - The permissions number.
	 */
	public resolvePermissionNumber(number: number): string[] {
		const resolved = [];

		for (const key of Object.keys(Permissions.FLAGS)) {
			if (BigInt(number) & Permissions.FLAGS[key]) resolved.push(key);
		}

		return resolved;
	}

	/**
	 * Resolves a role from a string, such as an ID, a name, or a mention.
	 * @param text - Text to resolve.
	 * @param roles - Collection of roles to find in.
	 * @param caseSensitive - Makes finding by name case sensitive.
	 * @param wholeWord - Makes finding by name match full word only.
	 */
	public resolveRole(text: string, roles: Collection<Snowflake, Role>, caseSensitive = false, wholeWord = false): Role {
		return roles.get(text as Snowflake) || roles.find(role => this.checkRole(text, role, caseSensitive, wholeWord));
	}

	/**
	 * Resolves multiple roles from a string, such as an ID, a name, or a mention.
	 * @param text - Text to resolve.
	 * @param roles - Collection of roles to find in.
	 * @param caseSensitive - Makes finding by name case sensitive.
	 * @param wholeWord - Makes finding by name match full word only.
	 */
	public resolveRoles(
		text: string,
		roles: Collection<Snowflake, Role>,
		caseSensitive = false,
		wholeWord = false
	): Collection<Snowflake, Role> {
		return roles.filter(role => this.checkRole(text, role, caseSensitive, wholeWord));
	}

	/**
	 * Resolves a user from a string, such as an ID, a name, or a mention.
	 * @param text - Text to resolve.
	 * @param users - Collection of users to find in.
	 * @param caseSensitive - Makes finding by name case sensitive.
	 * @param wholeWord - Makes finding by name match full word only.
	 */
	public resolveUser(
		text: Snowflake | string,
		users: Collection<Snowflake, User>,
		caseSensitive = false,
		wholeWord = false
	): User {
		return users.get(text as Snowflake) || users.find(user => this.checkUser(text, user, caseSensitive, wholeWord));
	}

	/**
	 * Resolves multiple users from a string, such as an ID, a name, or a mention.
	 * @param text - Text to resolve.
	 * @param users - Collection of users to find in.
	 * @param caseSensitive - Makes finding by name case sensitive.
	 * @param wholeWord - Makes finding by name match full word only.
	 */
	public resolveUsers(
		text: string,
		users: Collection<Snowflake, User>,
		caseSensitive = false,
		wholeWord = false
	): Collection<Snowflake, User> {
		return users.filter(user => this.checkUser(text, user, caseSensitive, wholeWord));
	}
}
