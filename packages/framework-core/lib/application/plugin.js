/*
 * Copyright 2024 MicroHacks
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { bind, setClassName } from "@voyage/helpers"

export class Plugin {
	/**
	 * Get the names of any configuration paths that this plugin expects to find. If a file isn't found, the application
	 * will instead use the corresponding value from the `defaultConfigs` method. If no default value is provided and
	 * no file is found, the application will throw an error.
	 *
	 * @returns {string[]}
	 */
	configPaths() {
		return []
	}

	/**
	 * Get a default set of configurations that the plugin expects. The key:value object returned by this function should
	 * have keys matching the configuration paths returned by the `configPaths` method
	 *
	 * The returned map should be json serializable, so that the application can generate a file on disk when requested
	 *
	 * @returns {Record<string, object>}
	 */
	defaultConfigs() {
		return {}
	}

	/**
	 * Perform actions before the kernel is initialised. This is executed after environment and configurations are loaded,
	 * but before creating a kernel or setting the container context - this method differs from the others, as it is the
	 * only one that is run outside a context, and with no kernel available via the container
	 *
	 * @param {Container} container
	 * @returns {Promise<void>}
	 */
	async boot(container) {}

	/**
	 * Perform actions before the application takes any actions. An action might be launching a web server, but may also
	 * be initiating the command line client or a worker
	 *
	 * Throwing an error will prevent the server from starting.
	 *
	 * @param {Container} container
	 * @returns {Promise<void>}
	 */
	async preLaunch(container) {}

	/**
	 * Perform actions immediately after the application has taken its action
	 *
	 * Will not be executed if an error occurred while launching the server.
	 *
	 * @param {Container} container
	 * @returns {Promise<void>}
	 */
	async postLaunch(container) {}

	/**
	 * Perform actions before processing an action. This executes at the start of the action lifecycle,
	 * before any middleware or handlers.
	 *
	 * @param {Container} container
	 * @returns {Promise<void>}
	 */
	async preAction(container) {}

	/**
	 * Perform actions after processing an action. This executes at the end of the action lifecycle,
	 * immediately before the response is sent to the client.
	 *
	 * @param {Container} container
	 * @returns {Promise<void>}
	 */
	async postAction(container) {}
}

function pluginName(callback) {
	return callback.name || callback.constructor.name || "anonymous"
}

/**
 * @export
 * @typedef {Function} PluginCallback
 * @param {Container} container
 * @returns {Promise<void> | void} The plugin should not return anything, but is optionally asynchronous
 */

/**
 * Create an anonymous plugin that runs the given callback function at the preLaunch step
 * @param {PluginCallback} callback The function to execute before the application has started
 * @returns {Plugin} A plugin class that wil register a pre launch application hook
 */
export function preLaunch(callback) {
	const P = class extends Plugin {
		/**
		 * @inheritDoc
		 */
		@bind
		async preLaunch(container) {
			await callback(container)
		}
	}
	setClassName(P, `PreLaunchPlugin<${pluginName(callback)}>`)
	return P
}

/**
 * Create an anonymous plugin that runs the given callback function before initialising the kernel
 * @param {PluginCallback} callback The function to execute before the kernel is created
 * @returns {Plugin} A plugin class that wil register a boot application hook
 */
export function onBoot(callback) {
	const P = class extends Plugin {
		/**
		 * @inheritDoc
		 */
		@bind
		async boot(container) {
			await callback(container)
		}
	}
	setClassName(P, `BootPlugin<${pluginName(callback)}>`)
	return P
}

/**
 * Create an anonymous plugin that runs the given callback function at the postLaunch step
 * @param {PluginCallback} callback The function to execute after the application has started
 * @returns {Plugin} A plugin class that wil register a post launch application hook
 */
export function postLaunch(callback) {
	const P = class extends Plugin {
		/**
		 * @inheritDoc
		 */
		@bind
		async postLaunch(container) {
			await callback(container)
		}
	}
	setClassName(P, `PostLaunchPlugin<${pluginName(callback)}>`)
	return P
}

/**
 * Create an anonymous plugin that runs the given callback function at the preAction step
 * @param {PluginCallback} callback The function to execute before an action
 * @returns {Plugin} A plugin class that wil register a pre action application hook
 */
export function preAction(callback) {
	const P = class extends Plugin {
		/**
		 * @inheritDoc
		 */
		@bind
		async preAction(container) {
			await callback(container)
		}
	}
	setClassName(P, `PreActionPlugin<${pluginName(callback)}>`)
	return P
}

/**
 * Create an anonymous plugin that runs the given callback function at the postAction step
 * @param {PluginCallback} callback The function to execute after an action
 * @returns {Plugin} A plugin class that wil register a post action application hook
 */
export function postAction(callback) {
	const P = class extends Plugin {
		/**
		 * @inheritDoc
		 */
		@bind
		async postAction(container) {
			await callback(container)
		}
	}
	setClassName(P, `PostActionPlugin<${pluginName(callback)}>`)
	return P
}

/**
 * Register an anonymous plugin that sets up a configuration value
 * @template {object} ConfigType The values provided to the application by this plugin
 *
 * @param {string} name
 * @param {ConfigType} defaults
 * @returns {Plugin} An anonymous plugin that registers a config file, and defaults for that config
 */
export function registerConfig(name, defaults) {
	const P = class extends Plugin {
		@bind
		configPaths() {
			return [name]
		}
		@bind
		defaultConfigs() {
			return { [name]: defaults }
		}
	}
	setClassName(P, `ConfigPlugin<${name}>`)
	return P
}
