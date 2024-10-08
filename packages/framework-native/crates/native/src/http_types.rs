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
use hyper::HeaderMap;
use neon::prelude::*;
use std::collections::HashMap;
use std::ops::{Deref, DerefMut};

pub struct Headers(HashMap<String, String>);

impl Deref for Headers {
	type Target = HashMap<String, String>;

	fn deref(&self) -> &Self::Target {
		&self.0
	}
}

impl DerefMut for Headers {
	fn deref_mut(&mut self) -> &mut Self::Target {
		&mut self.0
	}
}

impl Headers {
	pub fn new() -> Self {
		Headers(HashMap::new())
	}

	pub fn set_header(&mut self, key: &str, value: &str) {
		self.0.insert(key.to_lowercase(), value.to_lowercase());
	}

	pub fn as_object<'a>(&self, cx: &mut impl Context<'a>) -> JsResult<'a, JsObject> {
		let object = cx.empty_object();
		for (key, value) in &self.0 {
			let value = cx.string(value);
			object.set(cx, key.as_str(), value)?;
		}
		Ok(object)
	}
}

impl From<HeaderMap> for Headers {
	fn from(value: HeaderMap) -> Self {
		Headers(
			value
				.into_iter()
				.filter_map(|(k, v)| {
					k.map(|key| (key.as_str().to_lowercase(), v.to_str().unwrap().to_string()))
				})
				.collect(),
		)
	}
}
