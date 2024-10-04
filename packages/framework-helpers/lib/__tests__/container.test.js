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
import { dependenciesOf, hasDependencies, resolveName } from "../container.js"
import { alias, depends } from "../decorators.js"

describe("Name resolution", () => {
	it("Uses the constructor name as the default name", () => {
		class TestClass {}
		assert.equal(resolveName(TestClass), "TestClass")
	})

	it("Uses the alias if provided", () => {
		@alias("MyClass")
		class TestClass {}
		assert.equal(resolveName(TestClass), "MyClass")
	})

	it("Returns strings directly", () => {
		assert.equal(resolveName("myString"), "myString")
	})
})

describe("Dependency resolution", () => {
	it("Correctly fetches dependencies for classes", () => {
		@depends("foo", "bar")
		class TestClass {}

		assert.deepEqual(dependenciesOf(TestClass), ["foo", "bar"])
	})

	it("Correctly identifies classes or function types have dependencies", () => {
		const inject = depends("foo")

		class TestClass {}
		function testFunction() {}
		const testString = "testString"
		const testNumber = 123
		const testBoolean = true
		const testObject = { foo: "bar" }
		const testArray = [1, 2, 3]

		inject(TestClass)
		inject(testFunction)
		inject(testString)
		inject(testNumber)
		inject(testBoolean)
		inject(testObject)
		inject(testArray)

		assert(hasDependencies(TestClass))
		assert(hasDependencies(testFunction))

		// These types should not have dependencies assigned by the depends decorator
		assert(!hasDependencies(testObject))
		assert(!hasDependencies(testArray))
		assert(!hasDependencies(testString))
		assert(!hasDependencies(testNumber))
		assert(!hasDependencies(testBoolean))
	})
})
