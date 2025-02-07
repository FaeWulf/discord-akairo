import AkairoError from "../util/AkairoError";
import { AkairoHandlerEvents } from "../util/Constants";
import AkairoModule from "./AkairoModule";
import Category from "../util/Category";
import { Collection } from "discord.js";
import EventEmitter from "events";
import fs from "fs";
import path from "path";
import AkairoClient from "./AkairoClient";

export type Static<M> = { (): M };

/**
 * Base class for handling modules.
 * @param client - The Akairo client.
 * @param options - Options for module loading and handling.
 */
export default class AkairoHandler extends EventEmitter {
	public constructor(
		client: AkairoClient,
		{
			directory,
			classToHandle = AkairoModule,
			extensions = [".js", ".json", ".ts"],
			automateCategories = false,
			loadFilter = () => true
		}: AkairoHandlerOptions
	) {
		super();

		this.client = client;

		this.directory = directory;

		this.classToHandle = classToHandle;

		this.extensions = new Set(extensions);

		this.automateCategories = Boolean(automateCategories);

		this.loadFilter = loadFilter;

		this.modules = new Collection();

		this.categories = new Collection();
	}

	/**
	 * Whether or not to automate category names.
	 */
	public automateCategories: boolean;

	/**
	 * Categories, mapped by ID to Category.
	 */
	public categories: Collection<string, Category<string, AkairoModule>>;

	/**
	 * Class to handle.
	 */
	public classToHandle: typeof AkairoModule;

	/**
	 * The Akairo client.
	 */
	public client: AkairoClient;

	/**
	 * The main directory to modules.
	 */
	public directory: string;

	/**
	 * File extensions to load.
	 */
	public extensions: Set<string>;

	/**
	 * Function that filters files when loading.
	 */
	public loadFilter: LoadPredicate;

	/**
	 * Modules loaded, mapped by ID to AkairoModule.
	 */
	public modules: Collection<string, AkairoModule>;

	/**
	 * Deregisters a module.
	 * @param mod - Module to use.
	 */
	public deregister(mod: AkairoModule): void {
		if (mod.filepath) delete require.cache[require.resolve(mod.filepath)];
		this.modules.delete(mod.id);
		mod.category.delete(mod.id);
	}

	/**
	 * Finds a category by name.
	 * @param name - Name to find with.
	 */
	public findCategory(name: string): Category<string, AkairoModule> {
		return this.categories.find(category => {
			return category.id.toLowerCase() === name.toLowerCase();
		});
	}

	/**
	 * Loads a module, can be a module class or a filepath.
	 * @param thing - Module class or path to module.
	 * @param isReload - Whether this is a reload or not.
	 */
	public load(thing: string | AkairoModule, isReload = false): AkairoModule {
		const isClass = typeof thing === "function";
		if (!isClass && !this.extensions.has(path.extname(thing as string))) return undefined;

		let mod = isClass
			? thing
			: function findExport(m) {
					if (!m) return null;
					if (m.prototype instanceof this.classToHandle) return m;
					return m.default ? findExport.call(this, m.default) : null;
					// eslint-disable-next-line @typescript-eslint/no-var-requires
			  }.call(this, require(thing as string));

		if (mod && mod.prototype instanceof this.classToHandle) {
			mod = new mod(this); // eslint-disable-line new-cap
		} else {
			if (!isClass) delete require.cache[require.resolve(thing as string)];
			return undefined;
		}

		if (this.modules.has(mod.id)) throw new AkairoError("ALREADY_LOADED", this.classToHandle.name, mod.id);
		this.register(mod, isClass ? null : (thing as string));
		this.emit(AkairoHandlerEvents.LOAD, mod, isReload);
		return mod;
	}

	/**
	 * Reads all modules from a directory and loads them.
	 * @param directory - Directory to load from.
	 * Defaults to the directory passed in the constructor.
	 * @param filter - Filter for files, where true means it should be loaded.
	 * Defaults to the filter passed in the constructor.
	 */
	public loadAll(
		directory: string = this.directory,
		filter: LoadPredicate = this.loadFilter || (() => true)
	): AkairoHandler {
		const filepaths = AkairoHandler.readdirRecursive(directory);
		for (let filepath of filepaths) {
			filepath = path.resolve(filepath);
			if (filter(filepath)) this.load(filepath);
		}

		return this;
	}

	/**
	 * Registers a module.
	 * @param mod - Module to use.
	 * @param filepath - Filepath of module.
	 */
	public register(mod: AkairoModule, filepath: string): void {
		mod.filepath = filepath;
		mod.client = this.client;
		mod.handler = this;
		this.modules.set(mod.id, mod);

		if (mod.categoryID === "default" && this.automateCategories) {
			const dirs = path.dirname(filepath).split(path.sep);
			mod.categoryID = dirs[dirs.length - 1];
		}

		if (!this.categories.has(mod.categoryID)) {
			// @ts-expect-error
			this.categories.set(mod.categoryID, new Category(mod.categoryID));
		}

		const category = this.categories.get(mod.categoryID);
		mod.category = category;
		category.set(mod.id, mod);
	}

	/**
	 * Reloads a module.
	 * @param id - ID of the module.
	 */
	public reload(id: string): AkairoModule {
		const mod = this.modules.get(id.toString());
		if (!mod) throw new AkairoError("MODULE_NOT_FOUND", this.classToHandle.name, id);
		if (!mod.filepath) throw new AkairoError("NOT_RELOADABLE", this.classToHandle.name, id);

		this.deregister(mod);

		const filepath = mod.filepath;
		const newMod = this.load(filepath, true);
		return newMod;
	}

	/**
	 * Reloads all modules.
	 */
	public reloadAll(): AkairoHandler {
		for (const m of Array.from(this.modules.values())) {
			if (m.filepath) this.reload(m.id);
		}

		return this;
	}

	/**
	 * Removes a module.
	 * @param id - ID of the module.
	 */
	public remove(id: string): AkairoModule {
		const mod = this.modules.get(id.toString());
		if (!mod) throw new AkairoError("MODULE_NOT_FOUND", this.classToHandle.name, id);

		this.deregister(mod);

		this.emit(AkairoHandlerEvents.REMOVE, mod);
		return mod;
	}

	/**
	 * Removes all modules.
	 */
	public removeAll(): AkairoHandler {
		for (const m of Array.from(this.modules.values())) {
			if (m.filepath) this.remove(m.id);
		}

		return this;
	}

	/**
	 * Reads files recursively from a directory.
	 * @param directory - Directory to read.
	 */
	static readdirRecursive(directory: string): string[] {
		const result = [];

		(function read(dir) {
			const files = fs.readdirSync(dir);

			for (const file of files) {
				const filepath = path.join(dir, file);

				if (fs.statSync(filepath).isDirectory()) {
					read(filepath);
				} else {
					result.push(filepath);
				}
			}
		})(directory);

		return result;
	}
}

/**
 * Function for filtering files when loading.
 * True means the file should be loaded.
 * @param filepath - Filepath of file.
 */
export type LoadPredicate = (filepath: string) => boolean;

/**
 * Options for module loading and handling.
 */
export interface AkairoHandlerOptions {
	/** Whether or not to set each module's category to its parent directory name. */
	automateCategories?: boolean;

	/** Only classes that extends this class can be handled. */
	classToHandle?: typeof AkairoModule;

	/** Directory to modules. */
	directory?: string;

	/**
	 * File extensions to load.
	 * By default this is .js, .json, and .ts files.
	 */
	extensions?: string[] | Set<string>;

	/**
	 * Filter for files to be loaded.
	 * Can be set individually for each handler by overriding the `loadAll` method.
	 */
	loadFilter?: LoadPredicate;
}
