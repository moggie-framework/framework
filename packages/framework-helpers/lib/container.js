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

/** import type { HasDependencies, Resolvable } from './container.js' */

import { Semantics } from "./const.js"

/**
 * @param {string} classOrString
 * @returns {string}
 */
export function resolveName(classOrString) {
	if (typeof classOrString === "string") {
		return classOrString
	}
	return classOrString?.[Semantics.Alias] ?? classOrString?.prototype?.constructor?.name ?? "null"
}

/**
 * Determines whether the provided item has dependencies. An item without dependencies does not need
 * any further resolution by a container
 *
 * @param {any} item
 * @returns {item is HasDependencies}
 */
export function hasDependencies(item) {
	return item[Semantics.Requires] != null
}

/**
 * Get a list of dependencies for the provided item. This will be the list of identifiers requested by the item,
 * each of which may not necessarily be registered to the current container
 *
 * @param {Resolvable} item
 * @returns {Array<string>}
 */
export function dependenciesOf(item) {
	if (hasDependencies(item)) {
		return Reflect.get(item, Semantics.Requires)
	}
	return []
}
