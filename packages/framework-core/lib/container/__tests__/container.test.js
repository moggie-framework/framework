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

import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { container, Container, containerContext } from "../resolver.js"
import { alias, depends } from "@moggie/helpers"

describe("Container resolution", () => {
	it("Undecorated functions are passed a container ref when resolved dynamically", async () => {
		const instance = new Container()
		function someFunc(value) {
			assert(instance === value)
		}

		await assert.doesNotReject(() => instance.resolve(someFunc))
	})

	it("Resolves decorated functions", async () => {
		const instance = new Container()
		instance.when("test1").value(123)
		instance.when("test2").value(456)

		function testFunc(p1, p2) {
			assert(p1 === 123)
			assert(p2 === 456)
			return 123 + 456
		}

		depends("test1", "test2")(testFunc)

		const value = await instance.resolve(testFunc)
		assert(value === 579, `Expected 579, got ${value}`)
	})

	it("Creates new class instances when using the 'instance' method", async () => {
		const instance = new Container()

		let counter = 0
		class TestClass {
			constructor() {
				this.value = counter
				counter += 1
			}
		}

		instance.when(TestClass).instance(TestClass)

		assert(counter === 0)
		const first = await instance.resolve(TestClass)
		const second = await instance.resolve(TestClass)
		const third = await instance.resolve(TestClass)

		assert(first !== second)
		assert(first !== third)
		assert(second !== third)

		assert(counter === 3)
		assert(first.value === 0)
		assert(second.value === 1)
		assert(third.value === 2)
	})

	it("Lazily evaluates singletons", async () => {
		const instance = new Container()

		let numberConstructed = 0
		class TestSingleton {
			constructor() {
				numberConstructed += 1
			}
		}

		instance.when("singleton").singleton(TestSingleton)
		assert(numberConstructed === 0)

		await instance.resolve("singleton")
		assert(numberConstructed === 1)

		await instance.resolve("singleton")
		assert(numberConstructed === 1)
	})

	it("Only resolves singletons once per container", async () => {
		const instance1 = new Container()
		const instance2 = new Container()

		let numberConstructed = 0
		class TestSingleton {
			constructor() {
				numberConstructed += 1
			}
		}

		instance1.when("singleton").singleton(TestSingleton)
		instance2.when("singleton").singleton(TestSingleton)

		let inst1value1 = await instance1.resolve("singleton")
		let inst1value2 = await instance1.resolve("singleton")
		assert(numberConstructed === 1)

		let inst2value1 = await instance2.resolve("singleton")
		let inst2value2 = await instance2.resolve("singleton")
		await instance2.resolve("singleton")
		assert(numberConstructed === 2)

		assert(inst1value1 === inst1value2)
		assert(inst2value1 === inst2value2)
	})

	it("Correctly resolves alias'd names", async () => {
		@alias("OtherName")
		class TestClass {}
		const instance = new Container()
		instance.when(TestClass).instance(TestClass)

		const output = await instance.resolve("OtherName")
		assert(output instanceof TestClass)
	})

	it("Returns the exact value stored when using the 'value' method", async () => {
		const instance = new Container()

		instance.when("test").value(123)
		const value = await instance.resolve("test")
		assert(value === 123)

		const myObject = { value: Symbol("Can't duplicate this") }

		instance.when("other-test").value(myObject)
		const otherValue = await instance.resolve("other-test")
		assert(otherValue === myObject)
	})
})

describe("Container context", () => {
	it("Resolves the current container in the context", async () => {
		const appContainer = new Container()

		let resolvedContainer = null
		containerContext.run(appContainer, () => {
			resolvedContainer = container()
		})

		assert(appContainer === resolvedContainer)
	})

	it("Resolves the current container in the context with a nested container", async () => {
		const appContainer = new Container()
		const nestedContainer = appContainer.fork()

		let resolvedContainer = null
		containerContext.run(appContainer, () => {
			containerContext.run(nestedContainer, () => {
				resolvedContainer = container()
			})
		})

		assert(nestedContainer === resolvedContainer)
	})
})
