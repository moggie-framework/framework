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

import type { ContainerName, HasDependencies } from "@voyage/helpers"
import type { AsyncLocalStorage } from "node:async_hooks"
import { ConstructionMethod, DependencyBuilder } from "./dependency"

export declare const containerContext: AsyncLocalStorage<Container>
export function container(): Container
export function container<T>(value: ContainerName): Promise<T | null>

export class Container {
	constructor(parent: Container | undefined)
	fork(): Container
	register(name: ContainerName, item: ConstructionMethod): void
	when(name: ContainerName): DependencyBuilder
	has(name: ContainerName): boolean
	canResolve(name: ContainerName): boolean
	resolve<Output>(item: ContainerName): Output | null
	resolveAll(...items: ContainerName[]): (any | null)[]
	resolveDependenciesOf(item: HasDependencies): (any | null)[]
}
