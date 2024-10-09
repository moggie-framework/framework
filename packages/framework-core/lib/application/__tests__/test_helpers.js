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

import { containerContext } from "../../container/resolver.js"
import { Application } from "../application.js"
import { Kernel } from "../kernel.js"
import { setNestedValue } from "@voyage/helpers"

/**
 * @callback TestFunction
 * @param {import('node:test').TestContext} t
 * @returns {void|Promise<void>}
 */

/**
 * Run a single test within a new application's container context. This gives
 * access to items like config, and a basic kernel. To customise the application further, you can get the container to
 * resolve it with the "app" specifier
 *
 * @example <caption>The container context for the test will be set to a new application</caption>
 * it("Runs a test", withApplication({ conf: 123 }, async () => {
 *   const config = await container.resolve("config")
 *   assert(config('conf') === 123)
 * }))
 *
 * @example <caption>The test function will receive the TestContext</caption>
 * it("Runs a test", withApplication(async (t) => {
 *     t.test("First subtest", async (t) => {
 *		     // do something
 *     })
 *     t.test("Second subtest", () => {
 *         // do something, but it's not async this time
 *     })
 * }))
 *
 * @param {Function|object} initialConfig
 * @param {TestFunction} [testFn]
 * @returns {TestFunction}
 */
export function withApplication(initialConfig, testFn) {
	if (testFn === undefined && typeof initialConfig === "function") {
		testFn = initialConfig
		initialConfig = {}
	}
	setNestedValue(initialConfig, "disable.fs", true)
	setNestedValue(initialConfig, "disable.env", true)
	return async function (t) {
		const application = new Application(Kernel, initialConfig)
		await containerContext.run(application.$container, async () => testFn(t))
	}
}
