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

import { AsyncLocalStorage } from "node:async_hooks"
import { EventEmitter } from "node:events"
import {
	dependenciesOf,
	hasDependencies,
	resolveName,
	Semantics,
} from "@voyage/helpers"
import { DependencyBuilder } from "./dependency.js"
/** import { ContainerName, Resolvable } from '@voyage/helpers' */

/**
 * Private accessor for a resolver to store mappings between an identifier and the method for resolving it
 * @type {symbol}
 */
export const Mapping = Symbol("Container resolution mapping")
/**
 * Private accessor to store any cached data; this might include precomputed values, or singleton instances
 * @type {symbol}
 */
export const Cache = Symbol("Container cache")
/**
 * Private accessor to store a reference to a parent container, if one is linked to the current instance
 * @type {symbol}
 */
export const Parent = Symbol("Parent container reference")

/**
 * @type {AsyncLocalStorage<Container>}
 */
export const containerContext = new AsyncLocalStorage()

/**
 * @param {ContainerName} [resolution]
 * @returns {any|Container}
 */
export function container(resolution = undefined) {
	if (resolution != null) {
		return container().resolve(resolution)
	}
	return containerContext.getStore() ?? new Container()
}

export class Container extends EventEmitter {
	constructor(parent = null) {
		super()

		this[Mapping] = new Map()
		this[Cache] = new Map()
		this[Parent] = parent
	}

	/**
	 * Create a new child container that inherits from this container. Mappings are not duplicated, and instead the
	 * container will traverse its hierarchy to perform resolution
	 *
	 * @returns {Container}
	 */
	fork() {
		return new Container(this)
	}

	/**
	 * @param {string} name
	 * @param {ConstructionMethod} method
	 */
	register(name, method) {
		this[Mapping].set(resolveName(name), method)
	}

	/**
	 * Start to register the given name into the container. Nothing will be registered into the container
	 * until calling one of the resolution methods on the returned DependencyBuilder
	 *
	 * @param {ContainerName} name
	 * @returns {DependencyBuilder}
	 */
	when(name) {
		return new DependencyBuilder(name, this)
	}

	/**
	 * Check if this container has a mapping for the given name
	 *
	 * @param {ContainerName} name
	 * @returns {boolean}
	 */
	has(name) {
		const resolvedName = resolveName(name)
		return this[Mapping].has(resolvedName)
	}

	async ifExists(name, cb) {
		if (this.has(name)) {
			const dep = await this.resolve(name)
			return cb(dep)
		}
		return null
	}

	/**
	 * Check if this container is able to resolve an item for the given name.
	 * Differs from `has` in that it will also check the hierarchy this container is a part of, if appropriate
	 *
	 * @param {ContainerName} name
	 * @returns {boolean}
	 */
	canResolve(name) {
		const resolvedName = resolveName(name)
		return (
			this[Mapping].has(resolvedName) ||
			(this[Parent] && this[Parent].canResolve(name))
		)
	}

	/**
	 * Look up the container name of the given item in this container's mapping. If the name is registered, it will
	 * be resolved. If the name is not registered, the container will traverse any hierarchy it is a part of, returning
	 * the closest resolution
	 *
	 * Alternatively, passing in a function or class with dependencies that is not registered to the container
	 * will attempt to directly call or instantiate the item
	 *
	 * If no method succeeds, null will be returned
	 *
	 * @param {ContainerName} name
	 * @returns {Promise<any | null>}
	 */
	async resolve(name) {
		const resolvedName = resolveName(name)
		if (this[Mapping].has(resolvedName)) {
			return this[Mapping].get(resolvedName).construct(this)
		} else if (typeof name === "function" && hasDependencies(name)) {
			const func = name
			const dependencies = await this.resolveDependenciesOf(func)
			try {
				return Promise.resolve(func(...dependencies))
			} catch (error) {
				if (
					error instanceof TypeError &&
					error.message.startsWith("Class constructor")
				) {
					return new func(...dependencies)
				}
				throw error
			}
		}

		if (this[Parent]) {
			return this[Parent].resolve(name)
		}

		return null
	}

	/**
	 * Fully resolve the list of provided items depending on how they were registered into the container
	 *
	 * @param {ContainerName[]} names
	 * @returns {Promise<Awaited<*>[]>}
	 */
	async resolveAll(...names) {
		return await Promise.all(names.map(name => this.resolve(name)))
	}

	/**
	 * Given an item that may have dependencies, resolve them using the current container.
	 * Does not resolve the item itself
	 *
	 * @param {Resolvable} item
	 * @returns {Promise<any[]>}
	 */
	async resolveDependenciesOf(item) {
		const deps = dependenciesOf(item)
		return this.resolveAll(...deps)
	}
}
