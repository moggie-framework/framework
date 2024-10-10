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

function isPromise(value) {
	return (
		typeof value === "object" &&
		value !== null &&
		"then" in value &&
		"catch" in value
	)
}

/**
 * Run a test plan that expects the callback function to be called exactly `amount` times. Any other behavior results
 * in a failure; This function will check the plan execution at a specific time depending on whether `cb` returns a promise.
 *
 * For synchronous `cb`, the value will be checked as soon as the callback synchronously returns.
 * For asynchronous `cb`, the value will be checked as soon as the promise returned by `cb` resolves.
 *
 * @template T The output of user provided `cb`
 *
 * @param {number} amount
 * @param {(increment: () => void) => T | Promise<T>} cb
 * @returns {T | Promise<T>}
 */
export function testPlan(amount, cb) {
	const count = { value: 0 }
	const increment = () => {
		count.value += 1
	}

	const value = cb(increment)
	if (isPromise(value)) {
		return value.then(output => {
			assert.strictEqual(
				count.value,
				amount,
				"Test plan failed: expected exactly " +
					amount +
					" calls, but got " +
					count.value,
			)
			return output
		})
	} else {
		assert.strictEqual(
			count.value,
			amount,
			"Test plan failed: expected exactly " +
				amount +
				" calls, but got " +
				count.value,
		)
		return value
	}
}
