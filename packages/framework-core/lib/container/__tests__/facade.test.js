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
 * distributed under the License is distributed on an "alias IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { Facade } from "../facade.js"
import { Container, containerContext } from "../resolver.js"
import { alias } from "@voyage/helpers"

describe("Facade Static Accessor", () => {
	it("Will resolve the correct concretion registered to the container when called", async () => {
		@alias("SomeValue")
		class MyInterface extends Facade {
			foo() {
				throw Error("Not implemented")
			}
		}

		class MyConcrete extends MyInterface {
			foo() {
				return "bar"
			}
		}

		const container = new Container()
		container.when(MyInterface).instance(MyConcrete)

		await containerContext.run(container, async () => {
			let concretion = await MyInterface.facade()
			assert(concretion instanceof MyConcrete)
			assert.equal(concretion.foo(), "bar")
		})
	})

	it("Only resolves to concretions with a matching container name, if multiple types are registered with different names", async () => {
		@alias("Root")
		class RootInterface extends Facade {}

		class FirstConcrete extends RootInterface {}

		@alias("Child")
		class SecondConcrete extends RootInterface {}

		const container = new Container()
		container.when(FirstConcrete).instance(FirstConcrete)
		container.when(SecondConcrete).instance(SecondConcrete)

		await containerContext.run(container, async () => {
			let root1 = await RootInterface.facade()
			assert(root1 instanceof FirstConcrete)

			let root2 = await container.resolve(SecondConcrete)
			assert(root2 instanceof SecondConcrete)

			let root3 = await container.resolve(RootInterface)
			assert(root3 instanceof FirstConcrete)

			let root4 = await container.resolve(FirstConcrete)
			assert(root4 instanceof FirstConcrete)
		})
	})

	it("Correctly uses class name of inherited facade calls", async () => {
		@alias("Root")
		class RootInterface extends Facade {}

		class FirstConcrete extends RootInterface {}

		class SecondConcrete extends FirstConcrete {}

		const container = new Container()
		container.when(FirstConcrete).instance(FirstConcrete)
		container.when(SecondConcrete).instance(SecondConcrete)

		await containerContext.run(container, async () => {
			let root1 = await FirstConcrete.facade()
			assert(root1 instanceof FirstConcrete)

			let root2 = await SecondConcrete.facade()
			assert(root2 instanceof SecondConcrete)
		})
	})
})
