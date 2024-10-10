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

import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
	createCallable,
	createCallableAccessor,
	deepAssign,
	deferProxyImplementation,
	getNestedValue,
	isPlainObject,
} from "../objects.js"
import { testPlan } from "@moggie/testing-helpers"

describe("Nested object accessor", () => {
	it("Returns nested values", () => {
		const obj = {
			a: {
				b: {
					c: "value",
				},
			},
		}
		assert.equal(getNestedValue(obj, "a.b.c"), "value")
	})

	it("Returns undefined when a path part is not found", () => {
		const obj = {
			a: {
				b: {
					c: "value",
				},
			},
		}
		assert.equal(getNestedValue(obj, "a.b.d"), undefined)
	})

	it("Returns undefined for non-leaf missing path", () => {
		const obj = {
			a: {
				b: {
					c: "value",
				},
			},
		}
		assert.equal(getNestedValue(obj, "a.foo.b"), undefined)
	})

	it("Returns the root object for empty paths", () => {
		const obj = {
			a: {
				b: {
					c: "value",
				},
			},
		}
		assert.equal(getNestedValue(obj, ""), obj)
	})

	it("Ignores empty path parts", () => {
		const obj = {
			a: {
				b: {
					c: "value",
				},
			},
		}
		assert.equal(getNestedValue(obj, "a..b.c"), "value")
	})

	it("Returns null for null values", () => {
		const obj = {
			a: {
				b: {
					c: null,
				},
			},
		}
		assert.equal(getNestedValue(obj, "a.b.c"), null)
	})

	it("Returns undefined when trying to access properties of null values", () => {
		const obj = {
			a: {
				b: null,
			},
		}
		assert.equal(getNestedValue(obj, "a.b.c"), undefined)
	})
})

describe("Deep assignment", () => {
	it("Returns null if both inputs are not plain objects", () => {
		class Foo {}
		const matrixInput = [
			true,
			false,
			null,
			undefined,
			0,
			"",
			Infinity,
			NaN,
			"a longer string",
			BigInt(1234),
			Foo,
		]
		const nameOf = thing =>
			thing?.name ?? thing?.constructor?.name ?? typeof thing

		for (const first of matrixInput) {
			for (const second of matrixInput) {
				assert.equal(
					deepAssign(first, second),
					null,
					`deepAssign(${nameOf(first)}, ${nameOf(second)}) should return null`,
				)
			}
		}
	})

	it("Merges simple flat objects", () => {
		const obj1 = { a: 1, b: 2 }
		const obj2 = { c: 3, d: 4 }
		const result = deepAssign(obj1, obj2)
		assert.deepEqual(result, { a: 1, b: 2, c: 3, d: 4 })
	})

	it("Mutates & returns the first input", () => {
		const target = { a: 1, b: 2 }
		const output = deepAssign(target, { c: 3, d: 4 })
		assert(target === output)
	})

	it("Merges & sets nested properties", () => {
		const obj1 = { a: { b: 1 } }
		const obj2 = { a: { c: 2 } }
		const result = deepAssign(obj1, obj2)
		assert.deepEqual(result, { a: { b: 1, c: 2 } })
	})

	it("Replaces non-object properties in target with nested hierarchy", () => {
		const obj1 = { a: 1, b: 2 }
		const obj2 = { b: { c: 3 } }
		const result = deepAssign(obj1, obj2)
		assert.deepEqual(result, { a: 1, b: { c: 3 } })
	})

	it("Does not merge properties of arrays or functions", () => {
		const obj1 = { a: { value: 123 }, b: { value: 456 }, c: { value: 789 } }
		const obj2 = { a: [1, 2], b: function someFunc() {}, c() {} }
		const result = deepAssign(obj1, obj2)

		assert(Array.isArray(result.a), "Array property should not be merged")
		assert(
			typeof result.b === "function",
			"Function property should not be merged",
		)
		assert(
			typeof result.c === "function",
			"Function property should not be merged",
		)
	})
})

describe("Plain object check", () => {
	it("Returns true for plain objects", () => {
		assert(isPlainObject({}))
		assert(isPlainObject(Object.create(null)))
	})

	it("Returns false for array type values", () => {
		assert.strictEqual(isPlainObject([]), false)
		assert.strictEqual(isPlainObject(new Array()), false)
		assert.strictEqual(isPlainObject(new Set([1, 2, 3])), false)
	})

	it("Returns false for object-like class instances", () => {
		assert.strictEqual(isPlainObject(new Map()), false)
		assert.strictEqual(isPlainObject(new WeakMap()), false)
	})

	it("Returns false for constructed objects", () => {
		assert.strictEqual(isPlainObject(new Date()), false)
		assert.strictEqual(isPlainObject(new RegExp()), false)
		assert.strictEqual(isPlainObject(new WeakSet()), false)
		assert.strictEqual(isPlainObject(new (class Baz {})()), false)
	})

	it("Returns false for non-object values", () => {
		assert.strictEqual(isPlainObject(null), false)
		assert.strictEqual(isPlainObject(undefined), false)
		assert.strictEqual(isPlainObject(123), false)
		assert.strictEqual(isPlainObject("abc"), false)
		assert.strictEqual(
			isPlainObject(function foo() {}),
			false,
		)
		assert.strictEqual(isPlainObject(class Bar {}), false)
	})
})

describe("Callable accessor", () => {
	it("Returns default value when path part is not found", () => {
		const obj = {
			a: {
				b: {
					c: "value",
				},
			},
		}
		const accessor = createCallableAccessor(obj)
		assert.equal(accessor("a.b.d", "default"), "default")
	})

	it("Returns the value for a valid path", () => {
		const obj = {
			a: {
				b: {
					c: "value",
				},
			},
		}
		const accessor = createCallableAccessor(obj)
		assert.strictEqual(accessor("a.b.c"), "value")
	})

	it("Returns null for null values", () => {
		const obj = {
			a: {
				b: {
					c: null,
				},
			},
		}
		const accessor = createCallableAccessor(obj, { shouldReplaceNull: false })
		assert.strictEqual(accessor("a.b.c", 123), null)
	})

	it("Replaces null values with default value when option is set", () => {
		const obj = {
			a: {
				b: {
					c: null,
				},
			},
		}
		const accessor = createCallableAccessor(obj, { shouldReplaceNull: true })
		assert.strictEqual(accessor("a.b.c", 123), 123)
	})

	it("Supports property access with dot notation string", () => {
		const obj = {
			a: {
				b: {
					c: "value",
				},
			},
		}
		const accessor = createCallableAccessor(obj, { shouldReplaceNull: true })
		assert.strictEqual(accessor["a.b.c"], "value")
	})

	it("Supports regular property access to the underlying object", () => {
		const obj = {
			a: {
				b: {
					c: "value",
				},
			},
		}
		const accessor = createCallableAccessor(obj, { shouldReplaceNull: true })
		assert.strictEqual(accessor.a.b.c, "value")
	})
})

describe("Generic Callable", () => {
	it("Makes a constructed class instance callable", () => {
		class CallableClass {
			constructor() {
				return createCallable(this)
			}
			__call() {}
		}

		const inst = new CallableClass()
		assert.doesNotThrow(() => inst())
	})

	it("Does not interfere with standard class behaviours", () => {
		class CallableClass {
			constructor() {
				this.foobar = 890
				return createCallable(this)
			}
			method() {
				return 123
			}
			__call() {}
		}

		const inst = new CallableClass()
		assert.equal(inst.method(), 123)
		assert.equal(inst.foobar, 890)
	})

	it("Passes parameters to the __call method", t => {
		testPlan(3, plan => {
			class CallableClass {
				constructor() {
					return createCallable(this)
				}

				double(value) {
					plan()
					return value * 2
				}

				__call(first, second) {
					plan()
					assert.equal(first, 100)
					assert.equal(this.double(second), 300)
					return first + this.double(second)
				}
			}

			const inst = new CallableClass()
			assert.equal(inst(100, 150), 400)
		})
	})

	it("Inherits callability from parent class", () => {
		class ParentClass {
			constructor() {
				return createCallable(this)
			}

			parentMethod() {
				return "parent method"
			}

			__call() {}
		}

		class ChildClass extends ParentClass {
			childMethod() {
				return "child method"
			}
		}

		const parentInst = new ParentClass()
		const childInst = new ChildClass()

		assert.equal(parentInst.parentMethod(), "parent method")
		assert.equal(childInst.childMethod(), "child method")

		assert.doesNotThrow(() => parentInst())
		assert.doesNotThrow(() => childInst())
	})

	it("Child constructor maintains callability", () => {
		class ParentClass {
			constructor() {
				return createCallable(this)
			}
			__call() {
				return "parent method"
			}
		}

		class ChildClass extends ParentClass {
			constructor() {
				super()
			}
			__call() {
				return "child method"
			}
		}

		const parentInst = new ParentClass()
		const childInst = new ChildClass()

		assert.doesNotThrow(() => parentInst())
		assert.doesNotThrow(() => childInst())
	})

	it("Supports overriding __call method in inheritance chain", () => {
		class ParentClass {
			constructor() {
				return createCallable(this)
			}
			__call() {
				return "parent method"
			}
		}

		class ChildClass extends ParentClass {
			__call() {
				return "child method"
			}
		}

		const parentInst = new ParentClass()
		const childInst = new ChildClass()

		assert.equal(parentInst(), "parent method")
		assert.equal(childInst(), "child method")
	})
})
