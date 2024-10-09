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

import { Class } from "../types"

export function getNestedValue<OutT = any>(object: object, path: string): OutT
export function setNestedValue(object: object, path: string, value: any): void

export function isPlainObject(obj: any): obj is object

export function deepAssign(
	target: null | undefined,
	source: null | undefined,
): null
export function deepAssign(target: object, source: object): object
export function deepAssign<Source = object>(
	target: null | undefined,
	source: Source,
): Source
export function deepAssign<Target = object>(
	target: Target,
	source: null | undefined,
): Target

export function setClassName(clazz: Class<any>, name: string)

export type CallableAccessorOptions<NullValue extends boolean = boolean> = {
	shouldReplaceNull?: NullValue
}

declare function Accessor(path: string): any | undefined | null
declare function Accessor<Default>(path: string, fallback: Default): any | null
declare function AccessorWithoutNull<Default>(
	path: string,
): Default | null | undefined
declare function AccessorWithoutNull<Default>(
	path: string,
	fallback: Default,
): Default

export type CallableAccessor = typeof Accessor & Record<string, any>
export type CallableAccessorWithoutNull = typeof AccessorWithoutNull &
	Record<string, any>

export function createCallableAccessor(object: object): typeof Accessor
export function createCallableAccessor(
	object: Object,
	options: CallableAccessorOptions<false>,
): CallableAccessor
export function createCallableAccessor(
	object: Object,
	options: CallableAccessorOptions<true>,
): CallableAccessorWithoutNull
