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

/**
 * @typedef {Function} Builder
 * @template ConfigType
 * @param {ConfigType} config
 * @returns {any|Promise<any>}
 */

import { Facade } from "../container/facade.js"

/**
 * @class Manager
 * @template ConfigType
 *
 * @property {Map<string, Builder>} variants
 * @property {Map<string, any>} instances
 */
export class Manager extends Facade {
	constructor() {
		super()
		this.variants = new Map()
		this.instances = new Map()
	}

	manage(name, builder) {
		this.variants.set(name, builder)
	}

	manageClass(name, clazz) {
		this.variants.set(name, config => new clazz(config))
	}

	config() {
		return { driver: null }
	}

	async make(name = null) {
		const config = this.config()
		if (name == null) {
			name = config.driver
		}

		if (name === null) {
			throw new Error("No driver specified")
		}

		if (!this.variants.has(name)) {
			throw new Error(`No variant registered for ${name}`)
		}

		if (!this.instances.has(name)) {
			const builder = this.variants.get(name)
			const instance = await builder(config)
			this.instances.set(name, instance)
		}

		return this.instances.get(name)
	}
}
