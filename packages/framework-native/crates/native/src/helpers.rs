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
use hyper::http::{HeaderName, HeaderValue};
use hyper::HeaderMap;
use neon::prelude::*;
use neon::result::Throw;
use neon::thread::LocalKey;
use std::error::Error;
use std::fmt::Display;
use std::str::FromStr;
use tokio::runtime::Runtime;

static ASYNC_RUNTIME: LocalKey<Runtime> = LocalKey::new();
pub fn current_runtime<'a>(cx: &mut impl Context<'a>) -> &'a Runtime {
	ASYNC_RUNTIME.get_or_init(cx, || tokio::runtime::Runtime::new().unwrap())
}

pub type Throwable<T> = Result<T, Throw>;

fn call_console<'a>(
	method: &'static str,
	cx: &mut impl Context<'a>,
	message: impl Display,
) -> Throwable<()> {
	let log_message = cx.string(message.to_string());
	let console = cx.global::<JsObject>("console")?;
	let mut log_prop = console.prop(cx.cx_mut(), method);
	let mut log = log_prop.bind()?;
	log.arg(log_message)?.call()?;

	Ok(())
}

#[allow(unused)]
pub fn console_log<'a>(cx: &mut impl Context<'a>, message: impl Display) -> Throwable<()> {
	call_console("log", cx, message)
}
#[allow(unused)]
pub fn console_error<'a>(cx: &mut impl Context<'a>, message: impl Display) -> Throwable<()> {
	call_console("error", cx, message)
}
#[allow(unused)]
pub fn console_warn<'a>(cx: &mut impl Context<'a>, message: impl Display) -> Throwable<()> {
	call_console("warn", cx, message)
}

pub fn iter_object_entries<'a: 'b, 'b>(
	cx: &'b mut impl Context<'a>,
	obj: &'b Handle<'a, JsObject>,
) -> Throwable<Vec<(String, Handle<'a, JsValue>)>> {
	Ok(obj
		.get_own_property_names(cx)?
		.to_vec(cx)?
		.into_iter()
		.filter_map(|ket| {
			let key_str = ket.to_string(cx).ok()?;
			let native_str = key_str.value(cx);
			let value = obj.get_value(cx, key_str).ok()?;

			Some((native_str, value))
		})
		.collect())
}

pub fn object_to_headers<'a>(
	cx: &mut impl Context<'a>,
	obj: &Handle<'a, JsObject>,
) -> Throwable<HeaderMap> {
	let header_collection = iter_object_entries(cx, obj)?;
	let header_list = header_collection
		.into_iter()
		.filter_map(|(key, value)| {
			let value_str = value.to_string(cx).ok()?.value(cx);
			Some((key, value_str))
		})
		.filter_map(
			|(k, v)| match (HeaderName::from_str(&k), HeaderValue::from_str(&v)) {
				(Ok(k), Ok(v)) => Some((k, v)),
				_ => None,
			},
		);

	Ok(HeaderMap::from_iter(header_list))
}

pub fn throw_generic_error<'a>(cx: &mut impl Context<'a>, err: impl Error) -> Throw {
	cx.throw_error(format!("{}", err)).unwrap_or_else(|e| e)
}

#[macro_export]
macro_rules! throw_channel_error {
	($chann: expr, $cb: expr, $expr: expr) => {
		match $expr {
			Ok(value) => value,
			Err(e) => {
				$chann.send(move |mut cx| {
					let callback = $cb.into_inner(&mut cx);
					let this = cx.undefined();
					let err_msg = cx.string(format!("{}", e)).upcast();
					callback.call(&mut cx, this, vec![err_msg])?;
					Ok(())
				});
				return;
			}
		}
	};
	($chann: expr, $cb: expr, $expr: expr, $err_msg: expr) => {
		match $expr {
			Some(value) => value,
			None => {
				$chann.send(move |mut cx| {
					let callback = $cb.into_inner(&mut cx);
					let this = cx.undefined();
					let err_msg = cx.string(format!("{}", $err_msg)).upcast();
					callback.call(&mut cx, this, vec![err_msg])?;
					Ok(())
				});
				return;
			}
		}
	};
}
