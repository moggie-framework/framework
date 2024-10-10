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

import { Cache } from "./resolver.js"
import { hasDependencies, resolveName } from "@moggie/helpers"

export class DependencyBuilder {
	constructor(name, container) {
		this.name = name
		this.container = container
	}
	/**
	 * Map a type that should only be constructed once within the lifetime of it's registered container
	 *
	 * Mapping the same type as a singleton into a cloned container will result in a _new_ instance of that
	 * singleton being created by the cloned container
	 *
	 * @param {Class} clazz
	 * @returns {Resolver}
	 */
	singleton(clazz) {
		this.container.register(this.name, new SingletonMethod(this.name, clazz))
		return this.container
	}
	/**
	 * Map a type that should be constructed every time the dependency is resolved within the lifetime of
	 * it's registered container
	 *
	 * @param {Class} clazz
	 * @returns {Resolver}
	 */
	instance(clazz) {
		this.container.register(this.name, new InstanceMethod(this.name, clazz))
		return this.container
	}
	/**
	 * Map a type that should be constructed using a factory function whenever the dependency is resolved within
	 * the lifetime of it's registered container. If the function has been patched to container dependencies, those
	 * will be resolved and passed to it. If not, it will receive the container instance.
	 *
	 * Async & Sync functions are supported
	 *
	 * @param {Function} factory
	 * @returns {Resolver}
	 */
	result(factory) {
		this.container.register(this.name, new FactoryMethod(this.name, factory))
		return this.container
	}
	/**
	 * Map a single value that will be returned whenever the dependency is resolved within the lifetime of
	 * it's registered container
	 *
	 * @param {any} value
	 * @returns {Resolver}
	 */
	value(value) {
		this.container.register(this.name, new ValueMethod(this.name, value))
		return this.container
	}
}

/**
 * Define how the container should construct a certain item
 */
export class ConstructionMethod {
	constructor(name, item) {
		this.name = name
		this.item = item
	}
	async construct(container) {}
}

export class SingletonMethod extends ConstructionMethod {
	async construct(container) {
		const resolvedName = resolveName(this.name)
		if (!container[Cache].has(resolvedName)) {
			container[Cache].set(
				resolvedName,
				await new InstanceMethod(this.name, this.item).construct(container),
			)
		}
		return container[Cache].get(resolvedName)
	}
}

export class InstanceMethod extends ConstructionMethod {
	async construct(container) {
		const Item = this.item
		const deps = await container.resolveDependenciesOf(Item)
		return new Item(...deps)
	}
}

export class ValueMethod extends ConstructionMethod {
	async construct(container) {
		return this.item
	}
}

export class FactoryMethod extends ConstructionMethod {
	async construct(container) {
		const factory = this.item
		if (hasDependencies(factory)) {
			const dependencies = await container.resolveDependenciesOf(factory)
			return factory(...dependencies)
		}
		return factory(container)
	}
}
