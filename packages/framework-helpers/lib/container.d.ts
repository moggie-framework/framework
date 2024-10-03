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

import { RequiresSymbol } from "./const"

/**
 * An item that the container can resolve into an identifier, used for registering and resolving dependencies.
 */
export type ContainerName = string | (new (...args: any[]) => any)

/**
 * Converts an item into a usable identifier
 * @param {ContainerName} nameOrClass
 */
export function resolveName(nameOrClass: ContainerName): string

export interface HasDependencies {
	[RequiresSymbol]: string[]
}

export type Resolvable = ContainerName | HasDependencies

export function hasDependencies(item: any): item is HasDependencies

export function dependenciesOf(item: Resolvable): string[]
