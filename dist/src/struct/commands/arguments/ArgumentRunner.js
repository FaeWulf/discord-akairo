"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AkairoError_1 = __importDefault(require("../../../util/AkairoError"));
const Argument_1 = __importDefault(require("./Argument"));
const Constants_1 = require("../../../util/Constants");
const Flag_1 = __importDefault(require("../Flag"));
/**
 * Runs arguments.
 * @param command - Command to run for.
 */
class ArgumentRunner {
    constructor(command) {
        this.command = command;
    }
    /**
     * The command the arguments are being run for
     */
    command;
    /**
     * The Akairo client.
     */
    get client() {
        return this.command.client;
    }
    /**
     * The command handler.
     */
    get handler() {
        return this.command.handler;
    }
    /**
     * Runs the arguments.
     * @param message - Message that triggered the command.
     * @param parsed - Parsed data from ContentParser.
     * @param generator - Argument generator.
     */
    async run(message, parsed, generator) {
        const state = {
            usedIndices: new Set(),
            phraseIndex: 0,
            index: 0
        };
        const augmentRest = val => {
            if (Flag_1.default.is(val, "continue")) {
                val.rest = parsed.all
                    .slice(state.index)
                    .map(x => x.raw)
                    .join("");
            }
        };
        const iter = generator(message, parsed, state);
        let curr = await iter.next();
        while (!curr.done) {
            const value = curr.value;
            if (ArgumentRunner.isShortCircuit(value)) {
                augmentRest(value);
                return value;
            }
            const res = await this.runOne(message, parsed, state, new Argument_1.default(this.command, value));
            if (ArgumentRunner.isShortCircuit(res)) {
                augmentRest(res);
                return res;
            }
            curr = await iter.next(res);
        }
        augmentRest(curr.value);
        return curr.value;
    }
    /**
     * Runs one argument.
     * @param message - Message that triggered the command.
     * @param parsed - Parsed data from ContentParser.
     * @param state - Argument handling state.
     * @param arg - Current argument.
     */
    runOne(message, parsed, state, arg) {
        const cases = {
            [Constants_1.ArgumentMatches.PHRASE]: this.runPhrase,
            [Constants_1.ArgumentMatches.FLAG]: this.runFlag,
            [Constants_1.ArgumentMatches.OPTION]: this.runOption,
            [Constants_1.ArgumentMatches.REST]: this.runRest,
            [Constants_1.ArgumentMatches.SEPARATE]: this.runSeparate,
            [Constants_1.ArgumentMatches.TEXT]: this.runText,
            [Constants_1.ArgumentMatches.CONTENT]: this.runContent,
            [Constants_1.ArgumentMatches.REST_CONTENT]: this.runRestContent,
            [Constants_1.ArgumentMatches.NONE]: this.runNone
        };
        const runFn = cases[arg.match];
        if (runFn == null) {
            throw new AkairoError_1.default("UNKNOWN_MATCH_TYPE", arg.match);
        }
        return runFn.call(this, message, parsed, state, arg);
    }
    /**
     * Runs `phrase` match.
     * @param message - Message that triggered the command.
     * @param parsed - Parsed data from ContentParser.
     * @param state - Argument handling state.
     * @param arg - Current argument.
     */
    async runPhrase(message, parsed, state, arg) {
        if (arg.unordered || arg.unordered === 0) {
            const indices = typeof arg.unordered === "number"
                ? Array.from(parsed.phrases.keys()).slice(arg.unordered)
                : Array.isArray(arg.unordered)
                    ? arg.unordered
                    : Array.from(parsed.phrases.keys());
            for (const i of indices) {
                if (state.usedIndices.has(i)) {
                    continue;
                }
                // @ts-expect-error
                const phrase = parsed.phrases[i] ? parsed.phrases[i].value : "";
                // `cast` is used instead of `process` since we do not want prompts.
                const res = await arg.cast(message, phrase);
                if (res != null) {
                    state.usedIndices.add(i);
                    return res;
                }
            }
            // No indices matched.
            return arg.process(message, "");
        }
        const index = arg.index == null ? state.phraseIndex : arg.index;
        const ret = arg.process(message, 
        // @ts-expect-error
        parsed.phrases[index] ? parsed.phrases[index].value : "");
        if (arg.index == null) {
            ArgumentRunner.increaseIndex(parsed, state);
        }
        return ret;
    }
    /**
     * Runs `rest` match.
     * @param message - Message that triggered the command.
     * @param parsed - Parsed data from ContentParser.
     * @param state - Argument handling state.
     * @param arg - Current argument.
     */
    async runRest(message, parsed, state, arg) {
        const index = arg.index == null ? state.phraseIndex : arg.index;
        const rest = parsed.phrases
            .slice(index, index + arg.limit)
            .map(x => x.raw)
            .join("")
            .trim();
        const ret = await arg.process(message, rest);
        if (arg.index == null) {
            ArgumentRunner.increaseIndex(parsed, state);
        }
        return ret;
    }
    /**
     * Runs `separate` match.
     * @param message - Message that triggered the command.
     * @param parsed - Parsed data from ContentParser.
     * @param state - Argument handling state.
     * @param arg - Current argument.
     */
    async runSeparate(message, parsed, state, arg) {
        const index = arg.index == null ? state.phraseIndex : arg.index;
        const phrases = parsed.phrases.slice(index, index + arg.limit);
        if (!phrases.length) {
            const ret = await arg.process(message, "");
            if (arg.index != null) {
                ArgumentRunner.increaseIndex(parsed, state);
            }
            return ret;
        }
        const res = [];
        for (const phrase of phrases) {
            // @ts-expect-error
            const response = await arg.process(message, phrase.value);
            if (Flag_1.default.is(response, "cancel")) {
                return response;
            }
            res.push(response);
        }
        if (arg.index != null) {
            ArgumentRunner.increaseIndex(parsed, state);
        }
        return res;
    }
    /**
     * Runs `flag` match.
     * @param message - Message that triggered the command.
     * @param parsed - Parsed data from ContentParser.
     * @param state - Argument handling state.
     * @param arg - Current argument.
     */
    runFlag(message, parsed, state, arg) {
        const names = Array.isArray(arg.flag) ? arg.flag : [arg.flag];
        if (arg.multipleFlags) {
            const amount = parsed.flags.filter(flag => 
            // @ts-expect-error
            names.some(name => name.toLowerCase() === flag.key.toLowerCase())).length;
            // @ts-expect-error
            return amount;
        }
        const flagFound = parsed.flags.some(flag => 
        // @ts-expect-error
        names.some(name => name.toLowerCase() === flag.key.toLowerCase()));
        // @ts-expect-error
        return arg.default == null ? flagFound : !flagFound;
    }
    /**
     * Runs `option` match.
     * @param message - Message that triggered the command.
     * @param parsed - Parsed data from ContentParser.
     * @param state - Argument handling state.
     * @param arg - Current argument.
     */
    async runOption(message, parsed, state, arg) {
        const names = Array.isArray(arg.flag) ? arg.flag : [arg.flag];
        if (arg.multipleFlags) {
            const values = parsed.optionFlags
                .filter(flag => 
            // @ts-expect-error
            names.some(name => name.toLowerCase() === flag.key.toLowerCase()))
                // @ts-expect-error
                .map(x => x.value)
                .slice(0, arg.limit);
            const res = [];
            for (const value of values) {
                res.push(await arg.process(message, value));
            }
            return res;
        }
        const foundFlag = parsed.optionFlags.find(flag => 
        // @ts-expect-error
        names.some(name => name.toLowerCase() === flag.key.toLowerCase()));
        // @ts-expect-error
        return arg.process(message, foundFlag != null ? foundFlag.value : "");
    }
    /**
     * Runs `text` match.
     * @param message - Message that triggered the command.
     * @param parsed - Parsed data from ContentParser.
     * @param state - Argument handling state.
     * @param arg - Current argument.
     */
    runText(message, parsed, state, arg) {
        const index = arg.index == null ? 0 : arg.index;
        const text = parsed.phrases
            .slice(index, index + arg.limit)
            .map(x => x.raw)
            .join("")
            .trim();
        return arg.process(message, text);
    }
    /**
     * Runs `content` match.
     * @param message - Message that triggered the command.
     * @param parsed - Parsed data from ContentParser.
     * @param state - Argument handling state.
     * @param arg - Current argument.
     */
    runContent(message, parsed, state, arg) {
        const index = arg.index == null ? 0 : arg.index;
        const content = parsed.all
            .slice(index, index + arg.limit)
            .map(x => x.raw)
            .join("")
            .trim();
        return arg.process(message, content);
    }
    /**
     * Runs `restContent` match.
     * @param message - Message that triggered the command.
     * @param parsed - Parsed data from ContentParser.
     * @param state - Argument handling state.
     * @param arg - Current argument.
     */
    async runRestContent(message, parsed, state, arg) {
        const index = arg.index == null ? state.index : arg.index;
        const rest = parsed.all
            .slice(index, index + arg.limit)
            .map(x => x.raw)
            .join("")
            .trim();
        const ret = await arg.process(message, rest);
        if (arg.index == null) {
            ArgumentRunner.increaseIndex(parsed, state);
        }
        return ret;
    }
    /**
     * Runs `none` match.
     * @param message - Message that triggered the command.
     * @param parsed - Parsed data from ContentParser.
     * @param state - Argument handling state.
     * @param arg - Current argument.
     */
    runNone(message, parsed, state, arg) {
        return arg.process(message, "");
    }
    /**
     * Modifies state by incrementing the indices.
     * @param parsed - Parsed data from ContentParser.
     * @param state - Argument handling state.
     * @param n - Number of indices to increase by.
     */
    static increaseIndex(parsed, state, n = 1) {
        state.phraseIndex += n;
        while (n > 0) {
            do {
                state.index++;
            } while (parsed.all[state.index] && parsed.all[state.index].type !== "Phrase");
            n--;
        }
    }
    /**
     * Checks if something is a flag that short circuits.
     * @param value - A value.
     */
    static isShortCircuit(value) {
        return Flag_1.default.is(value, "cancel") || Flag_1.default.is(value, "retry") || Flag_1.default.is(value, "continue");
    }
    /**
     * Creates an argument generator from argument options.
     * @param args - Argument options.
     */
    static fromArguments(args) {
        // @ts-expect-error
        return function* generate() {
            const res = {};
            // @ts-expect-error
            for (const [id, arg] of args) {
                res[id] = yield arg;
            }
            return res;
        };
    }
}
exports.default = ArgumentRunner;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXJndW1lbnRSdW5uZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvc3RydWN0L2NvbW1hbmRzL2FyZ3VtZW50cy9Bcmd1bWVudFJ1bm5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDRFQUFvRDtBQUNwRCwwREFBdUQ7QUFDdkQsdURBQTBEO0FBQzFELG1EQUEyQjtBQUszQjs7O0dBR0c7QUFDSCxNQUFxQixjQUFjO0lBQ2xDLFlBQW1CLE9BQWdCO1FBQ2xDLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO0lBQ3hCLENBQUM7SUFFRDs7T0FFRztJQUNJLE9BQU8sQ0FBVTtJQUV4Qjs7T0FFRztJQUNILElBQVcsTUFBTTtRQUNoQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO0lBQzVCLENBQUM7SUFFRDs7T0FFRztJQUNILElBQVcsT0FBTztRQUNqQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO0lBQzdCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNJLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBZ0IsRUFBRSxNQUEyQixFQUFFLFNBQTRCO1FBQzNGLE1BQU0sS0FBSyxHQUFHO1lBQ2IsV0FBVyxFQUFFLElBQUksR0FBRyxFQUFVO1lBQzlCLFdBQVcsRUFBRSxDQUFDO1lBQ2QsS0FBSyxFQUFFLENBQUM7U0FDUixDQUFDO1FBRUYsTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDLEVBQUU7WUFDekIsSUFBSSxjQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsRUFBRTtnQkFDN0IsR0FBRyxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsR0FBRztxQkFDbkIsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7cUJBQ2xCLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7cUJBQ2YsSUFBSSxDQUFD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QVEsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRTtZQUMvRSxDQUFDLEVBQUUsQ0FBQztTQUNKO0lBQ0YsQ0FBQztJQUVEOzs7T0FHRztJQUNJLE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBVTtRQUN0QyxPQUFPLGNBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxJQUFJLGNBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxJQUFJLGNBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQzFGLENBQUM7SUFFRDs7O09BR0c7SUFDSSxNQUFNLENBQUMsYUFBYSxDQUFDLElBQXVCO1FBQ2xELG1CQUFtQjtRQUNuQixPQUFPLFFBQVEsQ0FBQyxDQUFDLFFBQVE7WUFDeEIsTUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDO1lBQ2YsbUJBQW1CO1lBQ25CLEtBQUssTUFBTSxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUU7Z0JBQzdCLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEdBQUcsQ0FBQzthQUNwQjtZQUVELE9BQU8sR0FBRyxDQUFDO1FBQ1osQ0FBQyxDQUFDO0lBQ0gsQ0FBQztDQUNEO0FBemFELGlDQXlhQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBBa2Fpcm9FcnJvciBmcm9tIFwiLi4vLi4vLi4vdXRpbC9Ba2Fpcm9FcnJvclwiO1xuaW1wb3J0IEFyZ3VtZW50LCB7IEFyZ3VtZW50T3B0aW9ucyB9IGZyb20gXCIuL0FyZ3VtZW50XCI7XG5pbXBvcnQgeyBBcmd1bWVudE1hdGNoZXMgfSBmcm9tIFwiLi4vLi4vLi4vdXRpbC9Db25zdGFudHNcIjtcbmltcG9ydCBGbGFnIGZyb20gXCIuLi9GbGFnXCI7XG5pbXBvcnQgeyBNZXNzYWdlIH0gZnJvbSBcImRpc2NvcmQuanNcIjtcbmltcG9ydCBDb21tYW5kLCB7IEFyZ3VtZW50R2VuZXJhdG9yIH0gZnJvbSBcIi4uL0NvbW1hbmRcIjtcbmltcG9ydCB7IENvbnRlbnRQYXJzZXJSZXN1bHQgfSBmcm9tIFwiLi4vQ29udGVudFBhcnNlclwiO1xuXG4vKipcbiAqIFJ1bnMgYXJndW1lbnRzLlxuICogQHBhcmFtIGNvbW1hbmQgLSBDb21tYW5kIHRvIHJ1biBmb3IuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFyZ3VtZW50UnVubmVyIHtcblx0cHVibGljIGNvbnN0cnVjdG9yKGNvbW1hbmQ6IENvbW1hbmQpIHtcblx0XHR0aGlzLmNvbW1hbmQgPSBjb21tYW5kO1xuXHR9XG5cblx0LyoqXG5cdCAqIFRoZSBjb21tYW5kIHRoZSBhcmd1bWVudHMgYXJlIGJlaW5nIHJ1biBmb3Jcblx0ICovXG5cdHB1YmxpYyBjb21tYW5kOiBDb21tYW5kO1xuXG5cdC8qKlxuXHQgKiBUaGUgQWthaXJvIGNsaWVudC5cblx0ICovXG5cdHB1YmxpYyBnZXQgY2xpZW50KCkge1xuXHRcdHJldHVybiB0aGlzLmNvbW1hbmQuY2xpZW50O1xuXHR9XG5cblx0LyoqXG5cdCAqIFRoZSBjb21tYW5kIGhhbmRsZXIuXG5cdCAqL1xuXHRwdWJsaWMgZ2V0IGhhbmRsZXIoKSB7XG5cdFx0cmV0dXJuIHRoaXMuY29tbWFuZC5oYW5kbGVyO1xuXHR9XG5cblx0LyoqXG5cdCAqIFJ1bnMgdGhlIGFyZ3VtZW50cy5cblx0ICogQHBhcmFtIG1lc3NhZ2UgLSBNZXNzYWdlIHRoYXQgdHJpZ2dlcmVkIHRoZSBjb21tYW5kLlxuXHQgKiBAcGFyYW0gcGFyc2VkIC0gUGFyc2VkIGRhdGEgZnJvbSBDb250ZW50UGFyc2VyLlxuXHQgKiBAcGFyYW0gZ2VuZXJhdG9yIC0gQXJndW1lbnQgZ2VuZXJhdG9yLlxuXHQgKi9cblx0cHVibGljIGFzeW5jIHJ1bihtZXNzYWdlOiBNZXNzYWdlLCBwYXJzZWQ6IENvbnRlbnRQYXJzZXJSZXN1bHQsIGdlbmVyYXRvcjogQXJndW1lbnRHZW5lcmF0b3IpOiBQcm9taXNlPEZsYWcgfCBhbnk+IHtcblx0XHRjb25zdCBzdGF0ZSA9IHtcblx0XHRcdHVzZWRJbmRpY2VzOiBuZXcgU2V0PG51bWJlcj4oKSxcblx0XHRcdHBocmFzZUluZGV4OiAwLFxuXHRcdFx0aW5kZXg6IDBcblx0XHR9O1xuXG5cdFx0Y29uc3QgYXVnbWVudFJlc3QgPSB2YWwgPT4ge1xuXHRcdFx0aWYgKEZsYWcuaXModmFsLCBcImNvbnRpbnVlXCIpKSB7XG5cdFx0XHRcdHZhbC5yZXN0ID0gcGFyc2VkLmFsbFxuXHRcdFx0XHRcdC5zbGljZShzdGF0ZS5pbmRleClcblx0XHRcdFx0XHQubWFwKHggPT4geC5yYXcpXG5cdFx0XHRcdFx0LmpvaW4oXCJcIik7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGNvbnN0IGl0ZXIgPSBnZW5lcmF0b3IobWVzc2FnZSwgcGFyc2VkLCBzdGF0ZSk7XG5cdFx0bGV0IGN1cnIgPSBhd2FpdCBpdGVyLm5leHQoKTtcblx0XHR3aGlsZSAoIWN1cnIuZG9uZSkge1xuXHRcdFx0Y29uc3QgdmFsdWUgPSBjdXJyLnZhbHVlO1xuXHRcdFx0aWYgKEFyZ3VtZW50UnVubmVyLmlzU2hvcnRDaXJjdWl0KHZhbHVlKSkge1xuXHRcdFx0XHRhdWdtZW50UmVzdCh2YWx1ZSk7XG5cdFx0XHRcdHJldHVybiB2YWx1ZTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgcmVzID0gYXdhaXQgdGhpcy5ydW5PbmUobWVzc2FnZSwgcGFyc2VkLCBzdGF0ZSwgbmV3IEFyZ3VtZW50KHRoaXMuY29tbWFuZCwgdmFsdWUpKTtcblx0XHRcdGlmIChBcmd1bWVudFJ1bm5lci5pc1Nob3J0Q2lyY3VpdChyZXMpKSB7XG5cdFx0XHRcdGF1Z21lbnRSZXN0KHJlcyk7XG5cdFx0XHRcdHJldHVybiByZXM7XG5cdFx0XHR9XG5cblx0XHRcdGN1cnIgPSBhd2FpdCBpdGVyLm5leHQocmVzKTtcblx0XHR9XG5cblx0XHRhdWdtZW50UmVzdChjdXJyLnZhbHVlKTtcblx0XHRyZXR1cm4gY3Vyci52YWx1ZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBSdW5zIG9uZSBhcmd1bWVudC5cblx0ICogQHBhcmFtIG1lc3NhZ2UgLSBNZXNzYWdlIHRoYXQgdHJpZ2dlcmVkIHRoZSBjb21tYW5kLlxuXHQgKiBAcGFyYW0gcGFyc2VkIC0gUGFyc2VkIGRhdGEgZnJvbSBDb250ZW50UGFyc2VyLlxuXHQgKiBAcGFyYW0gc3RhdGUgLSBBcmd1bWVudCBoYW5kbGluZyBzdGF0ZS5cblx0ICogQHBhcmFtIGFyZyAtIEN1cnJlbnQgYXJndW1lbnQuXG5cdCAqL1xuXHRwdWJsaWMgcnVuT25lKFxuXHRcdG1lc3NhZ2U6IE1lc3NhZ2UsXG5cdFx0cGFyc2VkOiBDb250ZW50UGFyc2VyUmVzdWx0LFxuXHRcdHN0YXRlOiBBcmd1bWVudFJ1bm5lclN0YXRlLFxuXHRcdGFyZzogQXJndW1lbnRcblx0KTogUHJvbWlzZTxGbGFnIHwgYW55PiB7XG5cdFx0Y29uc3QgY2FzZXMgPSB7XG5cdFx0XHRbQXJndW1lbnRNYXRjaGVzLlBIUkFTRV06IHRoaXMucnVuUGhyYXNlLFxuXHRcdFx0W0FyZ3VtZW50TWF0Y2hlcy5GTEFHXTogdGhpcy5ydW5GbGFnLFxuXHRcdFx0W0FyZ3VtZW50TWF0Y2hlcy5PUFRJT05dOiB0aGlzLnJ1bk9wdGlvbixcblx0XHRcdFtBcmd1bWVudE1hdGNoZXMuUkVTVF06IHRoaXMucnVuUmVzdCxcblx0XHRcdFtBcmd1bWVudE1hdGNoZXMuU0VQQVJBVEVdOiB0aGlzLnJ1blNlcGFyYXRlLFxuXHRcdFx0W0FyZ3VtZW50TWF0Y2hlcy5URVhUXTogdGhpcy5ydW5UZXh0LFxuXHRcdFx0W0FyZ3VtZW50TWF0Y2hlcy5DT05URU5UXTogdGhpcy5ydW5Db250ZW50LFxuXHRcdFx0W0FyZ3VtZW50TWF0Y2hlcy5SRVNUX0NPTlRFTlRdOiB0aGlzLnJ1blJlc3RDb250ZW50LFxuXHRcdFx0W0FyZ3VtZW50TWF0Y2hlcy5OT05FXTogdGhpcy5ydW5Ob25lXG5cdFx0fTtcblxuXHRcdGNvbnN0IHJ1bkZuID0gY2FzZXNbYXJnLm1hdGNoXTtcblx0XHRpZiAocnVuRm4gPT0gbnVsbCkge1xuXHRcdFx0dGhyb3cgbmV3IEFrYWlyb0Vycm9yKFwiVU5LTk9XTl9NQVRDSF9UWVBFXCIsIGFyZy5tYXRjaCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJ1bkZuLmNhbGwodGhpcywgbWVzc2FnZSwgcGFyc2VkLCBzdGF0ZSwgYXJnKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBSdW5zIGBwaHJhc2VgIG1hdGNoLlxuXHQgKiBAcGFyYW0gbWVzc2FnZSAtIE1lc3NhZ2UgdGhhdCB0cmlnZ2VyZWQgdGhlIGNvbW1hbmQuXG5cdCAqIEBwYXJhbSBwYXJzZWQgLSBQYXJzZWQgZGF0YSBmcm9tIENvbnRlbnRQYXJzZXIuXG5cdCAqIEBwYXJhbSBzdGF0ZSAtIEFyZ3VtZW50IGhhbmRsaW5nIHN0YXRlLlxuXHQgKiBAcGFyYW0gYXJnIC0gQ3VycmVudCBhcmd1bWVudC5cblx0ICovXG5cdHB1YmxpYyBhc3luYyBydW5QaHJhc2UoXG5cdFx0bWVzc2FnZTogTWVzc2FnZSxcblx0XHRwYXJzZWQ6IENvbnRlbnRQYXJzZXJSZXN1bHQsXG5cdFx0c3RhdGU6IEFyZ3VtZW50UnVubmVyU3RhdGUsXG5cdFx0YXJnOiBBcmd1bWVudFxuXHQpOiBQcm9taXNlPEZsYWcgfCBhbnk+IHtcblx0XHRpZiAoYXJnLnVub3JkZXJlZCB8fCBhcmcudW5vcmRlcmVkID09PSAwKSB7XG5cdFx0XHRjb25zdCBpbmRpY2VzID1cblx0XHRcdFx0dHlwZW9mIGFyZy51bm9yZGVyZWQgPT09IFwibnVtYmVyXCJcblx0XHRcdFx0XHQ/IEFycmF5LmZyb20ocGFyc2VkLnBocmFzZXMua2V5cygpKS5zbGljZShhcmcudW5vcmRlcmVkKVxuXHRcdFx0XHRcdDogQXJyYXkuaXNBcnJheShhcmcudW5vcmRlcmVkKVxuXHRcdFx0XHRcdD8gYXJnLnVub3JkZXJlZFxuXHRcdFx0XHRcdDogQXJyYXkuZnJvbShwYXJzZWQucGhyYXNlcy5rZXlzKCkpO1xuXG5cdFx0XHRmb3IgKGNvbnN0IGkgb2YgaW5kaWNlcykge1xuXHRcdFx0XHRpZiAoc3RhdGUudXNlZEluZGljZXMuaGFzKGkpKSB7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBAdHMtZXhwZWN0LWVycm9yXG5cdFx0XHRcdGNvbnN0IHBocmFzZSA9IHBhcnNlZC5waHJhc2VzW2ldID8gcGFyc2VkLnBocmFzZXNbaV0udmFsdWUgOiBcIlwiO1xuXHRcdFx0XHQvLyBgY2FzdGAgaXMgdXNlZCBpbnN0ZWFkIG9mIGBwcm9jZXNzYCBzaW5jZSB3ZSBkbyBub3Qgd2FudCBwcm9tcHRzLlxuXHRcdFx0XHRjb25zdCByZXMgPSBhd2FpdCBhcmcuY2FzdChtZXNzYWdlLCBwaHJhc2UpO1xuXHRcdFx0XHRpZiAocmVzICE9IG51bGwpIHtcblx0XHRcdFx0XHRzdGF0ZS51c2VkSW5kaWNlcy5hZGQoaSk7XG5cdFx0XHRcdFx0cmV0dXJuIHJlcztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBObyBpbmRpY2VzIG1hdGNoZWQuXG5cdFx0XHRyZXR1cm4gYXJnLnByb2Nlc3MobWVzc2FnZSwgXCJcIik7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaW5kZXggPSBhcmcuaW5kZXggPT0gbnVsbCA/IHN0YXRlLnBocmFzZUluZGV4IDogYXJnLmluZGV4O1xuXHRcdGNvbnN0IHJldCA9IGFyZy5wcm9jZXNzKFxuXHRcdFx0bWVzc2FnZSxcblx0XHRcdC8vIEB0cy1leHBlY3QtZXJyb3Jcblx0XHRcdHBhcnNlZC5waHJhc2VzW2luZGV4XSA/IHBhcnNlZC5waHJhc2VzW2luZGV4XS52YWx1ZSA6IFwiXCJcblx0XHQpO1xuXHRcdGlmIChhcmcuaW5kZXggPT0gbnVsbCkge1xuXHRcdFx0QXJndW1lbnRSdW5uZXIuaW5jcmVhc2VJbmRleChwYXJzZWQsIHN0YXRlKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmV0O1xuXHR9XG5cblx0LyoqXG5cdCAqIFJ1bnMgYHJlc3RgIG1hdGNoLlxuXHQgKiBAcGFyYW0gbWVzc2FnZSAtIE1lc3NhZ2UgdGhhdCB0cmlnZ2VyZWQgdGhlIGNvbW1hbmQuXG5cdCAqIEBwYXJhbSBwYXJzZWQgLSBQYXJzZWQgZGF0YSBmcm9tIENvbnRlbnRQYXJzZXIuXG5cdCAqIEBwYXJhbSBzdGF0ZSAtIEFyZ3VtZW50IGhhbmRsaW5nIHN0YXRlLlxuXHQgKiBAcGFyYW0gYXJnIC0gQ3VycmVudCBhcmd1bWVudC5cblx0ICovXG5cdHB1YmxpYyBhc3luYyBydW5SZXN0KFxuXHRcdG1lc3NhZ2U6IE1lc3NhZ2UsXG5cdFx0cGFyc2VkOiBDb250ZW50UGFyc2VyUmVzdWx0LFxuXHRcdHN0YXRlOiBBcmd1bWVudFJ1bm5lclN0YXRlLFxuXHRcdGFyZzogQXJndW1lbnRcblx0KTogUHJvbWlzZTxGbGFnIHwgYW55PiB7XG5cdFx0Y29uc3QgaW5kZXggPSBhcmcuaW5kZXggPT0gbnVsbCA/IHN0YXRlLnBocmFzZUluZGV4IDogYXJnLmluZGV4O1xuXHRcdGNvbnN0IHJlc3QgPSBwYXJzZWQucGhyYXNlc1xuXHRcdFx0LnNsaWNlKGluZGV4LCBpbmRleCArIGFyZy5saW1pdClcblx0XHRcdC5tYXAoeCA9PiB4LnJhdylcblx0XHRcdC5qb2luKFwiXCIpXG5cdFx0XHQudHJpbSgpO1xuXHRcdGNvbnN0IHJldCA9IGF3YWl0IGFyZy5wcm9jZXNzKG1lc3NhZ2UsIHJlc3QpO1xuXHRcdGlmIChhcmcuaW5kZXggPT0gbnVsbCkge1xuXHRcdFx0QXJndW1lbnRSdW5uZXIuaW5jcmVhc2VJbmRleChwYXJzZWQsIHN0YXRlKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmV0O1xuXHR9XG5cblx0LyoqXG5cdCAqIFJ1bnMgYHNlcGFyYXRlYCBtYXRjaC5cblx0ICogQHBhcmFtIG1lc3NhZ2UgLSBNZXNzYWdlIHRoYXQgdHJpZ2dlcmVkIHRoZSBjb21tYW5kLlxuXHQgKiBAcGFyYW0gcGFyc2VkIC0gUGFyc2VkIGRhdGEgZnJvbSBDb250ZW50UGFyc2VyLlxuXHQgKiBAcGFyYW0gc3RhdGUgLSBBcmd1bWVudCBoYW5kbGluZyBzdGF0ZS5cblx0ICogQHBhcmFtIGFyZyAtIEN1cnJlbnQgYXJndW1lbnQuXG5cdCAqL1xuXHRwdWJsaWMgYXN5bmMgcnVuU2VwYXJhdGUoXG5cdFx0bWVzc2FnZTogTWVzc2FnZSxcblx0XHRwYXJzZWQ6IENvbnRlbnRQYXJzZXJSZXN1bHQsXG5cdFx0c3RhdGU6IEFyZ3VtZW50UnVubmVyU3RhdGUsXG5cdFx0YXJnOiBBcmd1bWVudFxuXHQpOiBQcm9taXNlPEZsYWcgfCBhbnk+IHtcblx0XHRjb25zdCBpbmRleCA9IGFyZy5pbmRleCA9PSBudWxsID8gc3RhdGUucGhyYXNlSW5kZXggOiBhcmcuaW5kZXg7XG5cdFx0Y29uc3QgcGhyYXNlcyA9IHBhcnNlZC5waHJhc2VzLnNsaWNlKGluZGV4LCBpbmRleCArIGFyZy5saW1pdCk7XG5cdFx0aWYgKCFwaHJhc2VzLmxlbmd0aCkge1xuXHRcdFx0Y29uc3QgcmV0ID0gYXdhaXQgYXJnLnByb2Nlc3MobWVzc2FnZSwgXCJcIik7XG5cdFx0XHRpZiAoYXJnLmluZGV4ICE9IG51bGwpIHtcblx0XHRcdFx0QXJndW1lbnRSdW5uZXIuaW5jcmVhc2VJbmRleChwYXJzZWQsIHN0YXRlKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHJldDtcblx0XHR9XG5cblx0XHRjb25zdCByZXMgPSBbXTtcblx0XHRmb3IgKGNvbnN0IHBocmFzZSBvZiBwaHJhc2VzKSB7XG5cdFx0XHQvLyBAdHMtZXhwZWN0LWVycm9yXG5cdFx0XHRjb25zdCByZXNwb25zZSA9IGF3YWl0IGFyZy5wcm9jZXNzKG1lc3NhZ2UsIHBocmFzZS52YWx1ZSk7XG5cblx0XHRcdGlmIChGbGFnLmlzKHJlc3BvbnNlLCBcImNhbmNlbFwiKSkge1xuXHRcdFx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdFx0XHR9XG5cblx0XHRcdHJlcy5wdXNoKHJlc3BvbnNlKTtcblx0XHR9XG5cblx0XHRpZiAoYXJnLmluZGV4ICE9IG51bGwpIHtcblx0XHRcdEFyZ3VtZW50UnVubmVyLmluY3JlYXNlSW5kZXgocGFyc2VkLCBzdGF0ZSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlcztcblx0fVxuXG5cdC8qKlxuXHQgKiBSdW5zIGBmbGFnYCBtYXRjaC5cblx0ICogQHBhcmFtIG1lc3NhZ2UgLSBNZXNzYWdlIHRoYXQgdHJpZ2dlcmVkIHRoZSBjb21tYW5kLlxuXHQgKiBAcGFyYW0gcGFyc2VkIC0gUGFyc2VkIGRhdGEgZnJvbSBDb250ZW50UGFyc2VyLlxuXHQgKiBAcGFyYW0gc3RhdGUgLSBBcmd1bWVudCBoYW5kbGluZyBzdGF0ZS5cblx0ICogQHBhcmFtIGFyZyAtIEN1cnJlbnQgYXJndW1lbnQuXG5cdCAqL1xuXHRwdWJsaWMgcnVuRmxhZyhcblx0XHRtZXNzYWdlOiBNZXNzYWdlLFxuXHRcdHBhcnNlZDogQ29udGVudFBhcnNlclJlc3VsdCxcblx0XHRzdGF0ZTogQXJndW1lbnRSdW5uZXJTdGF0ZSxcblx0XHRhcmc6IEFyZ3VtZW50XG5cdCk6IFByb21pc2U8RmxhZyB8IGFueT4ge1xuXHRcdGNvbnN0IG5hbWVzID0gQXJyYXkuaXNBcnJheShhcmcuZmxhZykgPyBhcmcuZmxhZyA6IFthcmcuZmxhZ107XG5cdFx0aWYgKGFyZy5tdWx0aXBsZUZsYWdzKSB7XG5cdFx0XHRjb25zdCBhbW91bnQgPSBwYXJzZWQuZmxhZ3MuZmlsdGVyKGZsYWcgPT5cblx0XHRcdFx0Ly8gQHRzLWV4cGVjdC1lcnJvclxuXHRcdFx0XHRuYW1lcy5zb21lKG5hbWUgPT4gbmFtZS50b0xvd2VyQ2FzZSgpID09PSBmbGFnLmtleS50b0xvd2VyQ2FzZSgpKVxuXHRcdFx0KS5sZW5ndGg7XG5cblx0XHRcdC8vIEB0cy1leHBlY3QtZXJyb3Jcblx0XHRcdHJldHVybiBhbW91bnQ7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmxhZ0ZvdW5kID0gcGFyc2VkLmZsYWdzLnNvbWUoZmxhZyA9PlxuXHRcdFx0Ly8gQHRzLWV4cGVjdC1lcnJvclxuXHRcdFx0bmFtZXMuc29tZShuYW1lID0+IG5hbWUudG9Mb3dlckNhc2UoKSA9PT0gZmxhZy5rZXkudG9Mb3dlckNhc2UoKSlcblx0XHQpO1xuXG5cdFx0Ly8gQHRzLWV4cGVjdC1lcnJvclxuXHRcdHJldHVybiBhcmcuZGVmYXVsdCA9PSBudWxsID8gZmxhZ0ZvdW5kIDogIWZsYWdGb3VuZDtcblx0fVxuXG5cdC8qKlxuXHQgKiBSdW5zIGBvcHRpb25gIG1hdGNoLlxuXHQgKiBAcGFyYW0gbWVzc2FnZSAtIE1lc3NhZ2UgdGhhdCB0cmlnZ2VyZWQgdGhlIGNvbW1hbmQuXG5cdCAqIEBwYXJhbSBwYXJzZWQgLSBQYXJzZWQgZGF0YSBmcm9tIENvbnRlbnRQYXJzZXIuXG5cdCAqIEBwYXJhbSBzdGF0ZSAtIEFyZ3VtZW50IGhhbmRsaW5nIHN0YXRlLlxuXHQgKiBAcGFyYW0gYXJnIC0gQ3VycmVudCBhcmd1bWVudC5cblx0ICovXG5cdHB1YmxpYyBhc3luYyBydW5PcHRpb24oXG5cdFx0bWVzc2FnZTogTWVzc2FnZSxcblx0XHRwYXJzZWQ6IENvbnRlbnRQYXJzZXJSZXN1bHQsXG5cdFx0c3RhdGU6IEFyZ3VtZW50UnVubmVyU3RhdGUsXG5cdFx0YXJnOiBBcmd1bWVudFxuXHQpOiBQcm9taXNlPEZsYWcgfCBhbnk+IHtcblx0XHRjb25zdCBuYW1lcyA9IEFycmF5LmlzQXJyYXkoYXJnLmZsYWcpID8gYXJnLmZsYWcgOiBbYXJnLmZsYWddO1xuXHRcdGlmIChhcmcubXVsdGlwbGVGbGFncykge1xuXHRcdFx0Y29uc3QgdmFsdWVzID0gcGFyc2VkLm9wdGlvbkZsYWdzXG5cdFx0XHRcdC5maWx0ZXIoZmxhZyA9PlxuXHRcdFx0XHRcdC8vIEB0cy1leHBlY3QtZXJyb3Jcblx0XHRcdFx0XHRuYW1lcy5zb21lKG5hbWUgPT4gbmFtZS50b0xvd2VyQ2FzZSgpID09PSBmbGFnLmtleS50b0xvd2VyQ2FzZSgpKVxuXHRcdFx0XHQpXG5cdFx0XHRcdC8vIEB0cy1leHBlY3QtZXJyb3Jcblx0XHRcdFx0Lm1hcCh4ID0+IHgudmFsdWUpXG5cdFx0XHRcdC5zbGljZSgwLCBhcmcubGltaXQpO1xuXG5cdFx0XHRjb25zdCByZXMgPSBbXTtcblx0XHRcdGZvciAoY29uc3QgdmFsdWUgb2YgdmFsdWVzKSB7XG5cdFx0XHRcdHJlcy5wdXNoKGF3YWl0IGFyZy5wcm9jZXNzKG1lc3NhZ2UsIHZhbHVlKSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiByZXM7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZm91bmRGbGFnID0gcGFyc2VkLm9wdGlvbkZsYWdzLmZpbmQoZmxhZyA9PlxuXHRcdFx0Ly8gQHRzLWV4cGVjdC1lcnJvclxuXHRcdFx0bmFtZXMuc29tZShuYW1lID0+IG5hbWUudG9Mb3dlckNhc2UoKSA9PT0gZmxhZy5rZXkudG9Mb3dlckNhc2UoKSlcblx0XHQpO1xuXG5cdFx0Ly8gQHRzLWV4cGVjdC1lcnJvclxuXHRcdHJldHVybiBhcmcucHJvY2VzcyhtZXNzYWdlLCBmb3VuZEZsYWcgIT0gbnVsbCA/IGZvdW5kRmxhZy52YWx1ZSA6IFwiXCIpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFJ1bnMgYHRleHRgIG1hdGNoLlxuXHQgKiBAcGFyYW0gbWVzc2FnZSAtIE1lc3NhZ2UgdGhhdCB0cmlnZ2VyZWQgdGhlIGNvbW1hbmQuXG5cdCAqIEBwYXJhbSBwYXJzZWQgLSBQYXJzZWQgZGF0YSBmcm9tIENvbnRlbnRQYXJzZXIuXG5cdCAqIEBwYXJhbSBzdGF0ZSAtIEFyZ3VtZW50IGhhbmRsaW5nIHN0YXRlLlxuXHQgKiBAcGFyYW0gYXJnIC0gQ3VycmVudCBhcmd1bWVudC5cblx0ICovXG5cdHB1YmxpYyBydW5UZXh0KFxuXHRcdG1lc3NhZ2U6IE1lc3NhZ2UsXG5cdFx0cGFyc2VkOiBDb250ZW50UGFyc2VyUmVzdWx0LFxuXHRcdHN0YXRlOiBBcmd1bWVudFJ1bm5lclN0YXRlLFxuXHRcdGFyZzogQXJndW1lbnRcblx0KTogUHJvbWlzZTxGbGFnIHwgYW55PiB7XG5cdFx0Y29uc3QgaW5kZXggPSBhcmcuaW5kZXggPT0gbnVsbCA/IDAgOiBhcmcuaW5kZXg7XG5cdFx0Y29uc3QgdGV4dCA9IHBhcnNlZC5waHJhc2VzXG5cdFx0XHQuc2xpY2UoaW5kZXgsIGluZGV4ICsgYXJnLmxpbWl0KVxuXHRcdFx0Lm1hcCh4ID0+IHgucmF3KVxuXHRcdFx0LmpvaW4oXCJcIilcblx0XHRcdC50cmltKCk7XG5cdFx0cmV0dXJuIGFyZy5wcm9jZXNzKG1lc3NhZ2UsIHRleHQpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFJ1bnMgYGNvbnRlbnRgIG1hdGNoLlxuXHQgKiBAcGFyYW0gbWVzc2FnZSAtIE1lc3NhZ2UgdGhhdCB0cmlnZ2VyZWQgdGhlIGNvbW1hbmQuXG5cdCAqIEBwYXJhbSBwYXJzZWQgLSBQYXJzZWQgZGF0YSBmcm9tIENvbnRlbnRQYXJzZXIuXG5cdCAqIEBwYXJhbSBzdGF0ZSAtIEFyZ3VtZW50IGhhbmRsaW5nIHN0YXRlLlxuXHQgKiBAcGFyYW0gYXJnIC0gQ3VycmVudCBhcmd1bWVudC5cblx0ICovXG5cdHB1YmxpYyBydW5Db250ZW50KFxuXHRcdG1lc3NhZ2U6IE1lc3NhZ2UsXG5cdFx0cGFyc2VkOiBDb250ZW50UGFyc2VyUmVzdWx0LFxuXHRcdHN0YXRlOiBBcmd1bWVudFJ1bm5lclN0YXRlLFxuXHRcdGFyZzogQXJndW1lbnRcblx0KTogUHJvbWlzZTxGbGFnIHwgYW55PiB7XG5cdFx0Y29uc3QgaW5kZXggPSBhcmcuaW5kZXggPT0gbnVsbCA/IDAgOiBhcmcuaW5kZXg7XG5cdFx0Y29uc3QgY29udGVudCA9IHBhcnNlZC5hbGxcblx0XHRcdC5zbGljZShpbmRleCwgaW5kZXggKyBhcmcubGltaXQpXG5cdFx0XHQubWFwKHggPT4geC5yYXcpXG5cdFx0XHQuam9pbihcIlwiKVxuXHRcdFx0LnRyaW0oKTtcblx0XHRyZXR1cm4gYXJnLnByb2Nlc3MobWVzc2FnZSwgY29udGVudCk7XG5cdH1cblxuXHQvKipcblx0ICogUnVucyBgcmVzdENvbnRlbnRgIG1hdGNoLlxuXHQgKiBAcGFyYW0gbWVzc2FnZSAtIE1lc3NhZ2UgdGhhdCB0cmlnZ2VyZWQgdGhlIGNvbW1hbmQuXG5cdCAqIEBwYXJhbSBwYXJzZWQgLSBQYXJzZWQgZGF0YSBmcm9tIENvbnRlbnRQYXJzZXIuXG5cdCAqIEBwYXJhbSBzdGF0ZSAtIEFyZ3VtZW50IGhhbmRsaW5nIHN0YXRlLlxuXHQgKiBAcGFyYW0gYXJnIC0gQ3VycmVudCBhcmd1bWVudC5cblx0ICovXG5cdHB1YmxpYyBhc3luYyBydW5SZXN0Q29udGVudChcblx0XHRtZXNzYWdlOiBNZXNzYWdlLFxuXHRcdHBhcnNlZDogQ29udGVudFBhcnNlclJlc3VsdCxcblx0XHRzdGF0ZTogQXJndW1lbnRSdW5uZXJTdGF0ZSxcblx0XHRhcmc6IEFyZ3VtZW50XG5cdCk6IFByb21pc2U8RmxhZyB8IGFueT4ge1xuXHRcdGNvbnN0IGluZGV4ID0gYXJnLmluZGV4ID09IG51bGwgPyBzdGF0ZS5pbmRleCA6IGFyZy5pbmRleDtcblx0XHRjb25zdCByZXN0ID0gcGFyc2VkLmFsbFxuXHRcdFx0LnNsaWNlKGluZGV4LCBpbmRleCArIGFyZy5saW1pdClcblx0XHRcdC5tYXAoeCA9PiB4LnJhdylcblx0XHRcdC5qb2luKFwiXCIpXG5cdFx0XHQudHJpbSgpO1xuXHRcdGNvbnN0IHJldCA9IGF3YWl0IGFyZy5wcm9jZXNzKG1lc3NhZ2UsIHJlc3QpO1xuXHRcdGlmIChhcmcuaW5kZXggPT0gbnVsbCkge1xuXHRcdFx0QXJndW1lbnRSdW5uZXIuaW5jcmVhc2VJbmRleChwYXJzZWQsIHN0YXRlKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmV0O1xuXHR9XG5cblx0LyoqXG5cdCAqIFJ1bnMgYG5vbmVgIG1hdGNoLlxuXHQgKiBAcGFyYW0gbWVzc2FnZSAtIE1lc3NhZ2UgdGhhdCB0cmlnZ2VyZWQgdGhlIGNvbW1hbmQuXG5cdCAqIEBwYXJhbSBwYXJzZWQgLSBQYXJzZWQgZGF0YSBmcm9tIENvbnRlbnRQYXJzZXIuXG5cdCAqIEBwYXJhbSBzdGF0ZSAtIEFyZ3VtZW50IGhhbmRsaW5nIHN0YXRlLlxuXHQgKiBAcGFyYW0gYXJnIC0gQ3VycmVudCBhcmd1bWVudC5cblx0ICovXG5cdHB1YmxpYyBydW5Ob25lKFxuXHRcdG1lc3NhZ2U6IE1lc3NhZ2UsXG5cdFx0cGFyc2VkOiBDb250ZW50UGFyc2VyUmVzdWx0LFxuXHRcdHN0YXRlOiBBcmd1bWVudFJ1bm5lclN0YXRlLFxuXHRcdGFyZzogQXJndW1lbnRcblx0KTogUHJvbWlzZTxGbGFnIHwgYW55PiB7XG5cdFx0cmV0dXJuIGFyZy5wcm9jZXNzKG1lc3NhZ2UsIFwiXCIpO1xuXHR9XG5cblx0LyoqXG5cdCAqIE1vZGlmaWVzIHN0YXRlIGJ5IGluY3JlbWVudGluZyB0aGUgaW5kaWNlcy5cblx0ICogQHBhcmFtIHBhcnNlZCAtIFBhcnNlZCBkYXRhIGZyb20gQ29udGVudFBhcnNlci5cblx0ICogQHBhcmFtIHN0YXRlIC0gQXJndW1lbnQgaGFuZGxpbmcgc3RhdGUuXG5cdCAqIEBwYXJhbSBuIC0gTnVtYmVyIG9mIGluZGljZXMgdG8gaW5jcmVhc2UgYnkuXG5cdCAqL1xuXHRwdWJsaWMgc3RhdGljIGluY3JlYXNlSW5kZXgocGFyc2VkOiBDb250ZW50UGFyc2VyUmVzdWx0LCBzdGF0ZTogQXJndW1lbnRSdW5uZXJTdGF0ZSwgbiA9IDEpOiB2b2lkIHtcblx0XHRzdGF0ZS5waHJhc2VJbmRleCArPSBuO1xuXHRcdHdoaWxlIChuID4gMCkge1xuXHRcdFx0ZG8ge1xuXHRcdFx0XHRzdGF0ZS5pbmRleCsrO1xuXHRcdFx0fSB3aGlsZSAocGFyc2VkLmFsbFtzdGF0ZS5pbmRleF0gJiYgcGFyc2VkLmFsbFtzdGF0ZS5pbmRleF0udHlwZSAhPT0gXCJQaHJhc2VcIik7XG5cdFx0XHRuLS07XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIENoZWNrcyBpZiBzb21ldGhpbmcgaXMgYSBmbGFnIHRoYXQgc2hvcnQgY2lyY3VpdHMuXG5cdCAqIEBwYXJhbSB2YWx1ZSAtIEEgdmFsdWUuXG5cdCAqL1xuXHRwdWJsaWMgc3RhdGljIGlzU2hvcnRDaXJjdWl0KHZhbHVlOiBhbnkpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gRmxhZy5pcyh2YWx1ZSwgXCJjYW5jZWxcIikgfHwgRmxhZy5pcyh2YWx1ZSwgXCJyZXRyeVwiKSB8fCBGbGFnLmlzKHZhbHVlLCBcImNvbnRpbnVlXCIpO1xuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZXMgYW4gYXJndW1lbnQgZ2VuZXJhdG9yIGZyb20gYXJndW1lbnQgb3B0aW9ucy5cblx0ICogQHBhcmFtIGFyZ3MgLSBBcmd1bWVudCBvcHRpb25zLlxuXHQgKi9cblx0cHVibGljIHN0YXRpYyBmcm9tQXJndW1lbnRzKGFyZ3M6IEFyZ3VtZW50T3B0aW9uc1tdKTogR2VuZXJhdG9yRnVuY3Rpb24ge1xuXHRcdC8vIEB0cy1leHBlY3QtZXJyb3Jcblx0XHRyZXR1cm4gZnVuY3Rpb24qIGdlbmVyYXRlKCkge1xuXHRcdFx0Y29uc3QgcmVzID0ge307XG5cdFx0XHQvLyBAdHMtZXhwZWN0LWVycm9yXG5cdFx0XHRmb3IgKGNvbnN0IFtpZCwgYXJnXSBvZiBhcmdzKSB7XG5cdFx0XHRcdHJlc1tpZF0gPSB5aWVsZCBhcmc7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiByZXM7XG5cdFx0fTtcblx0fVxufVxuXG4vKipcbiAqIFN0YXRlIGZvciB0aGUgYXJndW1lbnQgcnVubmVyLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEFyZ3VtZW50UnVubmVyU3RhdGUge1xuXHQvKiogSW5kZXggaW4gdGVybXMgb2YgdGhlIHJhdyBzdHJpbmdzLiAqL1xuXHRpbmRleDogbnVtYmVyO1xuXG5cdC8qKiBJbmRleCBpbiB0ZXJtcyBvZiBwaHJhc2VzLiAqL1xuXHRwaHJhc2VJbmRleDogbnVtYmVyO1xuXG5cdC8qKiBJbmRpY2VzIGFscmVhZHkgdXNlZCBmb3IgdW5vcmRlcmVkIG1hdGNoLiAqL1xuXHR1c2VkSW5kaWNlczogU2V0PG51bWJlcj47XG59XG4iXX0=