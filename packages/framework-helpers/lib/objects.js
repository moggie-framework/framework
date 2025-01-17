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
export function getNestedValue(object, path) {
	const pathParts = path.split(".")
	return _getNested(object, pathParts)
}

/**
 * @param {object} object
 * @param {string} path
 * @param {any} value
 */
export function setNestedValue(object, path, value) {
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
		// Param is an object, but is not null
		obj != null &&
		// Arrays have type "object"
		!Array.isArray(obj) &&
		// Either a null proto object, or a direct instance of Object
		(obj?.__proto__ == null || obj.constructor === Object)
	)
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

/**
 * Ensure the string contains any characters separated by a dot
 * Ending or starting with a dot is not valid as an accessor
 *
 * @type {RegExp}
 */
const CONTAINER_PATH_ACCESSOR = /[^.]\.[^.]/

/**
 * Enable callable syntax to access nested properties of a given object. The accessor supports dot syntax strings
 * for nested properties, and can be provided a fallback value to return instead of undefined, and optionally null
 *
 * @param {any} obj
 * @param {{shouldReplaceNull?: boolean}} opts
 * @returns {(function(string, any | undefined): any)}
 */
export function createCallableAccessor(obj, opts) {
	obj = isPlainObject(obj) ? obj : {}
	const shouldReplaceNull = opts?.shouldReplaceNull ?? false
	const accessor = (path, fallback) => {
		if (path == null && fallback == null) {
			return obj
		}
		const value = getNestedValue(obj, path)
		if (value === undefined) {
			return fallback
		} else if (shouldReplaceNull && value === null) {
			return fallback ?? null
		}
		return value
	}

	return new Proxy(accessor, {
		get(target, prop) {
			if (Reflect.has(obj, prop)) {
				return Reflect.get(obj, prop)
			} else if (CONTAINER_PATH_ACCESSOR.test(prop)) {
				return getNestedValue(obj, prop)
			}
		},
	})
}

export function createCallable(classInstance) {
	const callable = new Function()
	callable.prototype = classInstance.constructor

	return new Proxy(callable, {
		...deferProxyImplementation(classInstance),
		apply(target, thisArg, argArray) {
			if (classInstance.__call) {
				return classInstance.__call(...argArray)
			}
			return Reflect.apply(target, thisArg, argArray)
		},
	})
}

export function deferProxyImplementation(realTarget) {
	return {
		has(_, prop) {
			return Reflect.has(realTarget, prop)
		},
		get(_, prop) {
			return Reflect.get(realTarget, prop)
		},
		set(_, p, newValue, receiver) {
			return Reflect.set(realTarget, p, newValue, receiver)
		},
		apply(_, thisArg, argArray) {
			return Reflect.apply(realTarget, thisArg, argArray)
		},
		construct(_, argArray, newTarget) {
			return Reflect.construct(realTarget, argArray, newTarget)
		},
		defineProperty(_, property, attributes) {
			return Reflect.defineProperty(realTarget, property, attributes)
		},
		deleteProperty(_, p) {
			return Reflect.deleteProperty(realTarget, p)
		},
		ownKeys(_) {
			return Reflect.ownKeys(realTarget)
		},
		getOwnPropertyDescriptor(_, p) {
			return Reflect.getOwnPropertyDescriptor(realTarget, p)
		},
		isExtensible(_) {
			return Reflect.isExtensible(realTarget)
		},
		preventExtensions(_) {
			return Reflect.preventExtensions(realTarget)
		},
		getPrototypeOf(_) {
			return Reflect.getPrototypeOf(realTarget)
		},
		setPrototypeOf(_, v) {
			return Reflect.setPrototypeOf(realTarget, v)
		},
	}
}
