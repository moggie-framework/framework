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

function _getNested(obj, path = []) {
	let value = undefined
	const key = path.shift()
	if (key == null) {
		return undefined
	}

	if (key.trim() === "") {
		value = obj
	} else {
		value = obj[key]
	}

	// Make sure we don't cronk valid null values
	if (value === undefined) {
		return undefined
	}

	if (path.length > 0) {
		if (value === null) {
			return undefined
		}
		return _getNested(value, path)
	}

	return value
}

/**
 * @param {object} object
 * @param {string} path
 * @returns {any}
 */
export function getNestedKey(object, path) {
	const pathParts = path.split(".")
	return _getNested(object, pathParts)
}

/**
 * @param {object} object
 * @param {string} path
 * @param {any} value
 */
export function setNestedKey(object, path, value) {
	const pathParts = path.split(".")
	const finalKey = pathParts.pop()

	if (finalKey == null) {
		return
	}

	if (pathParts.length === 0 && typeof object === "object" && object != null) {
		object[finalKey] = value
	} else {
		const target = _getNested(object, pathParts)
		if (typeof target === "object" && target != null) {
			target[finalKey] = value
		}
	}
}

/**
 * @param {any} obj
 * @returns {obj is object}
 */
export function isPlainObject(obj) {
	return (
		typeof obj === "object" &&
		obj != null && // Param is an object, but is not null
		!Array.isArray(obj) && // Arrays have type "object"
		(!Object.hasOwn(obj, "constructor") || obj.constructor === Object)
	) // Either a null proto object, or a direct instance of Object
}

/**
 * @param {object|null|undefined} target
 * @param {object|null|undefined} source
 * @returns {object|null}
 */
export function deepAssign(target, source) {
	if (!isPlainObject(target) && isPlainObject(source)) {
		return { ...source } // We only expect to mutate the first parameter
	}
	if (!isPlainObject(source) && isPlainObject(target)) {
		return target
	}
	if (!isPlainObject(target) && !isPlainObject(source)) {
		return null
	}

	for (const [key, value] of Object.entries(source)) {
		if (isPlainObject(value)) {
			target[key] = deepAssign(!target[key] ? {} : target[key], value)
		} else {
			target[key] = value
		}
	}

	return target
}

export function setClassName(clazz, name) {
	Object.defineProperty(clazz, "name", { value: name })
}
