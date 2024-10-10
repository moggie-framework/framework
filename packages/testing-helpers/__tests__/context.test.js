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
import { testPlan } from "../context.js"
import assert from "assert/strict"
import { setTimeout } from "node:timers/promises"

describe("Test Plan Contract", () => {
	it("Expects no calls when amount is 0", () => {
		testPlan(0, plan => {})
	})

	it("Should handle synchronous callback", () => {
		testPlan(2, plan => {
			plan()
			plan()
		})
	})

	it("Should reject when callback is called more than expected", () => {
		assert.throws(() => {
			testPlan(2, plan => {
				plan()
				plan()
				plan()
			})
		})
	})

	it("Should reject when callback is called less than expected", () => {
		assert.throws(() => {
			testPlan(3, plan => {
				plan()
				plan()
			})
		})
	})

	it("Should handle asynchronous callback", async () => {
		await testPlan(2, async plan => {
			await plan()
			await setTimeout(10)
			await plan()
		})
	})

	it("Should reject when asynchronous callback is called more than expected", async () => {
		await assert.rejects(
			testPlan(2, async plan => {
				await plan()
				await plan()
				await setTimeout(10)
				await plan()
			}),
		)
	})

	it("Should reject when asynchronous callback is called less than expected", async () => {
		await assert.rejects(
			testPlan(3, async plan => {
				await setTimeout(10)
				await plan()
			}),
		)
	})

	it("Should allow errors occurring in the callback to bubble", () => {
		// testPlan has a descriptive message in the assertion error, whereas we need to check for the basic
		// inner error message, despite `plan` not being called enough times
		assert.throws(() => {
			testPlan(1, plan => {
				assert(false, "TEST")
			})
		}, "[ERR_ASSERTION]: TEST")
	})

	it("Should allow errors occurring async callbacks to bubble", async () => {
		// testPlan has a descriptive message in the assertion error, whereas we need to check for the basic
		// inner error message, despite `plan` not being called enough times
		await assert.rejects(
			testPlan(1, async plan => {
				assert(false, "TEST")
			}),
			"[ERR_ASSERTION]: TEST",
		)
	})
})
