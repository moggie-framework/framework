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

import type { Container } from "./resolver"
import type { Class } from "@moggie/helpers/types"

export class DependencyBuilder {
	constructor(name: string, container: Container)
	/**
	 * Map a type that should only be constructed once within the lifetime of it's registered container
	 *
	 * Mapping the same type as a singleton into a cloned container will result in a _new_ instance of that
	 * singleton being created by the cloned container
	 */
	singleton(clazz: Class<any>): Container
	/**
	 * Map a type that should be constructed every time the dependency is resolved within the lifetime of
	 * it's registered container
	 */
	instance(clazz: Class<any>): Container
	/**
	 * Map a type that should be constructed using a factory function whenever the dependency is resolved within
	 * the lifetime of it's registered container. If the function has been patched to container dependencies, those
	 * will be resolved and passed to it. If not, it will receive the container instance.
	 *
	 * Async & Sync functions are supported
	 */
	result(factory: Function): Container
	/**
	 * Map a single value that will be returned whenever the dependency is resolved within the lifetime of
	 * it's registered container
	 */
	value(value: any): Container
}

export abstract class ConstructionMethod {
	constructor(name: string, item: any)
	construct(container: Container): Promise<any>
}

export class SingletonMethod extends ConstructionMethod {}
export class InstanceMethod extends ConstructionMethod {}
export class ValueMethod extends ConstructionMethod {}
export class FactoryMethod extends ConstructionMethod {}
