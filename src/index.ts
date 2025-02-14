import "discord-akairo-message-util";
import "source-map-support/register";
import packageJSON from "../package.json";
import AkairoClient, { AkairoOptions } from "./struct/AkairoClient";
import AkairoHandler, { AkairoHandlerOptions, LoadPredicate } from "./struct/AkairoHandler";
import AkairoModule, { AkairoModuleOptions } from "./struct/AkairoModule";
import ClientUtil from "./struct/ClientUtil";
import Argument, {
	ArgumentMatch,
	ArgumentOptions,
	ArgumentPromptData,
	ArgumentPromptOptions,
	ArgumentType,
	ArgumentTypeCaster,
	ArgumentTypeCaster_,
	DefaultArgumentOptions,
	DefaultValueSupplier,
	FailureData,
	OtherwiseContentModifier,
	OtherwiseContentSupplier,
	ParsedValuePredicate,
	PromptContentModifier,
	PromptContentSupplier
} from "./struct/commands/arguments/Argument";
import TypeResolver from "./struct/commands/arguments/TypeResolver";
import Command, {
	ArgumentGenerator,
	BeforeAction,
	CommandOptions,
	ExecutionPredicate,
	KeySupplier,
	MissingPermissionSupplier,
	RegexSupplier
} from "./struct/commands/Command";
import CommandHandler, {
	CommandHandlerOptions,
	CooldownData,
	IgnoreCheckPredicate,
	MentionPrefixPredicate,
	ParsedComponentData,
	PrefixSupplier
} from "./struct/commands/CommandHandler";
import CommandUtil from "./struct/commands/CommandUtil";
import Flag from "./struct/commands/Flag";
import Inhibitor, { InhibitorOptions } from "./struct/inhibitors/Inhibitor";
import InhibitorHandler from "./struct/inhibitors/InhibitorHandler";
import Listener, { ListenerOptions } from "./struct/listeners/Listener";
import ListenerHandler from "./struct/listeners/ListenerHandler";
import Task, { TaskOptions } from "./struct/tasks/Task";
import TaskHandler from "./struct/tasks/TaskHandler";
import type {
	AkairoHandlerEvents,
	CommandHandlerEvents,
	InhibitorHandlerEvents,
	ListenerHandlerEvents,
	TaskHandlerEvents
} from "./typings/events";
import type { GuildTextBasedChannels } from "./typings/guildTextBasedChannels";
import AkairoError from "./util/AkairoError";
import AkairoMessage from "./util/AkairoMessage";
import Category from "./util/Category";
import * as Constants from "./util/Constants";
import Util from "./util/Util";

const version = packageJSON.version;

export {
	AkairoClient,
	AkairoError,
	AkairoHandler,
	AkairoHandlerEvents,
	AkairoHandlerOptions,
	AkairoMessage,
	AkairoModule,
	AkairoModuleOptions,
	AkairoOptions,
	Argument,
	ArgumentGenerator,
	ArgumentMatch,
	ArgumentOptions,
	ArgumentPromptData,
	ArgumentPromptOptions,
	ArgumentType,
	ArgumentTypeCaster_,
	ArgumentTypeCaster,
	BeforeAction,
	Category,
	ClientUtil,
	Command,
	CommandHandler,
	CommandHandlerEvents,
	CommandHandlerOptions,
	CommandOptions,
	CommandUtil,
	Constants,
	CooldownData,
	DefaultArgumentOptions,
	DefaultValueSupplier,
	ExecutionPredicate,
	FailureData,
	Flag,
	GuildTextBasedChannels,
	IgnoreCheckPredicate,
	Inhibitor,
	InhibitorHandler,
	InhibitorHandlerEvents,
	InhibitorOptions,
	KeySupplier,
	Listener,
	ListenerHandler,
	ListenerHandlerEvents,
	ListenerOptions,
	LoadPredicate,
	MentionPrefixPredicate,
	MissingPermissionSupplier,
	OtherwiseContentModifier,
	OtherwiseContentSupplier,
	ParsedComponentData,
	ParsedValuePredicate,
	PrefixSupplier,
	PromptContentModifier,
	PromptContentSupplier,
	RegexSupplier,
	Task,
	TaskHandler,
	TaskHandlerEvents,
	TaskOptions,
	TypeResolver,
	Util,
	version
};
