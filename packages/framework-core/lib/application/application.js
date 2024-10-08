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

import { EventEmitter } from "node:events"
import pathUtil from "node:path"
import {
	bind,
	createCallableAccessor,
	deepAssign,
	isPlainObject,
} from "@voyage/helpers"
import { Container } from "../container/resolver.js"
import { tryLoadConfigFiles } from "./configuration.js"
import { Plugin } from "./plugin.js"

/** import { ApplicationEventMap } from "./application.js"; */

export class Application extends EventEmitter {
	get $configRoot() {
		return pathUtil.resolve(this.opts.configRoot || "config")
	}

	get config() {
		return createCallableAccessor(this.$config, { shouldReplaceNull: true })
	}

	constructor(opts = {}) {
		super()
		this.opts = opts
		this.$config = {}
		this.$container = new Container()
		this.$plugins = []

		this.setDefaults()
	}

	setDefaults() {
		this.$container.when("app").value(this)
		this.$container.when("config").result(() => this.config)
	}

	loadEnvironment() {
		if (this.opts.disable?.env) {
			return
		}

		let files = [".env"]
		if (Array.isArray(this.opts.env)) {
			files = this.opts.env
		} else if (!!process.env.NODE_ENV) {
			files.unshift(`.env.${process.env.NODE_ENV.toLowerCase()}`)
		}
		if (typeof this.opts.env === "string") {
			files.unshift(this.opts.env)
		}

		for (const file of files) {
			process.loadEnvFile(file)
		}
	}

	/**
	 *
	 * @returns {Promise<void>}
	 */
	async loadConfig() {
		const config = {}
		const paths = []
		for (const plugin of this.$plugins) {
			const pluginPaths = plugin.configPaths() ?? []
			const defaults = plugin.configDefaults() ?? {}
			for (const key of pluginPaths) {
				if (typeof defaults[key] === "function") {
					const configValue = await defaults[key]()
					deepAssign(config, { [key]: configValue })
				} else if (defaults[key]) {
					deepAssign(config, { [key]: defaults[key] })
				}
			}
			paths.push(...pluginPaths)
		}

		if (!this.opts.disable?.fs) {
			const loadedConfig = await tryLoadConfigFiles(this.$configRoot, paths)
			deepAssign(config, loadedConfig)
		}

		if (isPlainObject(this.opts.config)) {
			deepAssign(config, this.opts.config)
		}
		this.$config = config
	}

	register(...plugins) {
		for (const plugin of plugins) {
			if (!(plugin.prototype instanceof Plugin)) {
				throw new TypeError("Can only register an instance of Plugin")
			}
			this.$plugins.push(new plugin())
		}
	}

	async boot() {
		this.loadEnvironment()
		await this.loadConfig()

		this.emit("app:booting")
		for (const plugin of this.$plugins) {
			await plugin.boot(this.$container)
		}
		this.emit("app:booted")
	}

	@bind
	async launching() {
		this.emit("app:launching")
		for (const plugin of this.plugins) {
			await plugin.preLaunch(this.$container)
		}
	}

	@bind
	async launched() {
		this.emit("app:launched")
		for (const plugin of this.plugins) {
			await plugin.postLaunch(this.$container)
		}
	}

	@bind
	async processing() {
		this.emit("app:processing")
		for (const plugin of this.plugins) {
			await plugin.preAction(this.$container)
		}
	}

	@bind
	async processed() {
		this.emit("app:processed")
		for (const plugin of this.plugins) {
			await plugin.postAction(this.$container)
		}
	}
}
