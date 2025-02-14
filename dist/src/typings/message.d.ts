import CommandUtil from "../struct/commands/CommandUtil";
export declare module discord.js {
    interface Message {
        /**
         * Extra properties applied to the Discord.js message object.
         * Utilities for command responding.
         * Available on all messages after 'all' inhibitors and built-in inhibitors (bot, client).
         * Not all properties of the util are available, depending on the input.
         * */
        util?: CommandUtil;
    }
}
//# sourceMappingURL=message.d.ts.map