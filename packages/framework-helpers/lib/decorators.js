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

import { Semantics } from "./const.js"
import { resolveName } from "./container.js"

/**
 * Sets the name that the DI container should use to resolve the provided class definition. Applying this decorator to
 * any other value type is a noop
 *
 * @param {string|Class} name
 * @returns {(function(*, {kind: string}=): void)}
 */
export function alias(name) {
	return function setContainerName(value, { kind } = {}) {
		if (kind === "class") {
			value[Semantics.Alias] = resolveName(name)
		}
	}
}

export const as = alias

/**
 * Binds a class method to that class on initialisation, ensuring that it always refers to its class context
 *
 * @param method
 * @param context
 */
export function bind(method, context) {
	if (context.kind === "method") {
		context.addInitializer(function () {
			const bound = method.bind(this)
			Reflect.defineProperty(this, context.name, {
				value: bound,
				configurable: true,
				writable: true,
				enumerable: true,
			})
		})
	}
}

export function depends(...dependencies) {
	return function setDependencies(value, { kind } = {}) {
		if (kind === "class" || typeof value === "function") {
			value[Semantics.Requires] = dependencies
		}
	}
}
