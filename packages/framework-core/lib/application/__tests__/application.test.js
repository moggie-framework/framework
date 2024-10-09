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
import { Application } from "../application.js"

import { postLaunch, preLaunch, registerConfig } from "../plugin.js"
import { Kernel } from "../kernel.js"
import { container, containerContext } from "../../container/resolver.js"
import { withApplication } from "./test_helpers.js"

describe("App config", () => {
	it("Loads from a default provider via plugin", async () => {
		const app = new Application(Kernel)
		app.register(
			registerConfig("test", {
				someValue: 123,
			}),
		)

		await app.boot()
		assert(app.config.test.someValue === 123)
	})

	it("Uses config callable syntax to access nested config data", async () => {
		const app = new Application(Kernel, {
			config: {
				test: {
					someValue: {
						nestedValue: 456,
					},
				},
			},
		})

		app.register(
			postLaunch(async container => {
				const config = await container.resolve("config")
				const value = config("test.someValue.nestedValue")
				assert(value === 456)
			}),
		)

		await app.launch()
	})

	it("Uses object getter syntax to access nested config data", async () => {
		const app = new Application(Kernel, {
			config: {
				test: {
					someValue: {
						nestedValue: 456,
					},
				},
			},
		})

		app.register(
			postLaunch(async container => {
				const config = await container.resolve("config")
				const value = config["test.someValue.nestedValue"]
				assert(value === 456)
			}),
		)

		await app.launch()
	})

	it(
		"Returns the default value when a key is not found",
		withApplication({ config: { test: { value: 123 } } }, async () => {
			const config = await container("config")
			assert.equal(config("http.port"), undefined)
			assert.equal(config("http.port", 80), 80)
		}),
	)

	it(
		"Returns the entire config object when no key is provided",
		withApplication({ config: { test: { value: 123 } } }, async () => {
			const config = await container("config")
			assert.deepEqual(config(), { test: { value: 123 } })
		}),
	)
})

describe("App plugin system", () => {
	it("Only accepts 'Plugin' subclasses", () => {
		assert.throws(
			() => {
				const app = new Application()
				app.register("not a plugin")
			},
			{ name: "TypeError" },
			"Expected Application to reject non-Plugin instance",
		)
	})

	it("Runs in a container context containing the app", async t => {
		t.plan(1)

		const app = new Application()
		app.register(
			preLaunch(async container => {
				const innerApp = await container.resolve("app")
				t.assert.ok(
					innerApp === app,
					"Container context does not contain the app instance",
				)
			}),
		)

		// Running the full "launch" sequence for the app would enter a container context.
		// For the sake of not potentially steamrolling other tests, we just run in an isolated
		// context for this test
		await containerContext.run(app.$container, async () => {
			await app.launching()
		})
	})

	it("Runs plugins in registration order", async () => {
		const app = new Application()
		let pluginOrder = []
		app.register(
			preLaunch(async container => {
				pluginOrder.push("plugin1")
			}),
			preLaunch(async container => {
				pluginOrder.push("plugin2")
			}),
		)

		await app.launching()

		assert.deepEqual(
			pluginOrder,
			["plugin1", "plugin2"],
			"Plugins were not run in registration order",
		)
	})

	it("Maintains values between plugins in the container", async t => {
		t.plan(1)
		const app = new Application()
		app.register(
			preLaunch(async container => {
				container.when("someValue").value(123)
			}),
			preLaunch(async container => {
				const someValue = await container.resolve("someValue")
				t.assert.ok(someValue === 123, "Value not preserved between plugins")
			}),
		)

		await app.launching()
	})

	it("Propagates errors from preLaunch plugins", async () => {
		const app = new Application()
		app.register(
			preLaunch(async () => {
				throw new Error("Pre-launch plugin error")
			}),
		)

		await assert.rejects(
			app.launching(),
			{
				name: "Error",
				message: "Pre-launch plugin error",
			},
			"Pre-launch plugin should throw an error",
		)
	})
})
