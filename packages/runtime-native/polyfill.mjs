/*
 * Copyright 2025 Weird Boi
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

const InitialiserStore = Symbol("[[initialiser]]")

function setInitialisers(target, list) {
	const existing = Reflect.get(target, InitialiserStore) ?? []
	const additions = Array.isArray(list) ? list : [list]

	Object.defineProperty(target, InitialiserStore, {
		value: [...existing, ...additions],
		enumerable: false,
		writable: false,
		configurable: false,
	})
}

function runInitialisers() {
	if (this.constructor == null) {
		throw new TypeError("Cannot run initialisers on object that is not a class instance")
	}

	const initialisers = Reflect.get(this.constructor, InitialiserStore)
	if (initialisers) {
		for (const initializer of initialisers) {
			initializer.call(this)
		}
	}
}

function callDecorator(decorator, hostClass, context) {
	const initialisers = []
	context.addInitializer = (initializer) => initialisers.push(initializer)

	switch (context.kind) {
		case "class":
			applyClassDecorator(decorator, hostClass, context)
			break
		case "method":
			applyMethodDecorator(decorator, hostClass, context)
			break
		case "getter":
			applyGetterDecorator(decorator, hostClass, context)
			break
		case "setter":
			applySetterDecorator(decorator, hostClass, context)
			break
		case "field":
			applyFieldDecorator(decorator, hostClass, context)
			break
		case "accessor":
			applyAccessorDecorator(decorator, hostClass, context)
			break
		default:
			throw new TypeError(`Unsupported context type: ${context.kind}`)
	}

	if (initialisers) {
		setInitialisers(hostClass, initialisers)
	}
	return result
}

/**
 *
 * @param {Class} hostClass
 * @param {string | undefined} className
 * @param {ClassDecorator[]} decoratorList
 */
function applyAllClassDecorators(hostClass, className, decoratorList) {
	const initialisers = []
	const context = {
		kind: "class",
    name: className,
		addInitializer: (initializer) => initialisers.push(initializer),
	}

	let result = hostClass
	while (decoratorList.length > 0) {
		const decorator = decoratorList.pop()
		result = decorator(result, context) ?? result
	}

	for (const initializer of initialisers) {
		initializer.call(result)
	}

	return result
}

function applyClassDecorator(decorator, hostClass, context) {
	const initialisers = []
	context.addInitializer = (initializer) => initialisers.push(initializer)
}

function applyMethodDecorator(decorator, hostClass, context) {
	hostClass.prototype[context.name] = decorator(hostClass.prototype[context.name], context) ?? hostClass.prototype[context.name]
}

function applyGetterDecorator(decorator, hostClass, context) {
	let { get } = Object.getOwnPropertyDescriptor(hostClass.prototype, context.name)
	get = decorator(get, context) ?? get
	Object.defineProperty(hostClass.prototype, context.name, {
    get,
  })
}

function applySetterDecorator(decorator, hostClass, context) {
	let { set } = Object.getOwnPropertyDescriptor(hostClass.prototype, context.name)
	set = decorator(set, context) ?? set
	Object.defineProperty(hostClass.prototype, context.name, {
		set,
	})}

function applyFieldDecorator(decorator, hostClass, context) {
	return undefined
}

function applyAccessorDecorator(decorator, hostClass, context) {
	return undefined
}



export { callDecorator as $cd$, setInitialisers as $si$, runInitialisers as $ri$, applyAllClassDecorators as $acd$ }