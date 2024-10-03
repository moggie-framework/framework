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

export function getNestedKey<OutT = any>(object: object, path: string): OutT
export function setNestedKey(object: object, path: string, value: any)

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
