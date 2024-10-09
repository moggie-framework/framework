use crate::helpers::{current_runtime, object_to_headers, throw_generic_error};
use crate::http_types::{serialise_body, Headers, RequestBody};
use crate::throw_channel_error;
use http_body_util::BodyExt;
use hyper::body::{Bytes, Incoming};
use hyper::client::conn::http1::SendRequest;
use hyper::http::uri::Authority;
use hyper::http::HeaderValue;
use hyper::{header, HeaderMap, Request, Response, Uri};
use hyper_util::rt::TokioIo;
use neon::context::FunctionContext;
use neon::prelude::{
	Context, Finalize, JsFunction, JsObject, JsResult, JsString, JsTypedArray, JsUndefined,
	JsValue, Object,
};
use neon::types::JsBox;
use std::collections::hash_map::Entry;
use std::collections::HashMap;
use std::ops::{Deref, DerefMut};
use std::str::FromStr;
use std::sync::Arc;
use tokio::net::TcpStream;
use tokio::sync::Mutex;
use tokio::task::JoinHandle;

pub type BoxedClient = JsBox<Arc<HyperClient>>;

pub struct HyperClientRuntime {
	connections: HashMap<String, (SendRequest<RequestBody>, JoinHandle<()>)>,
}
pub struct HyperClient(Mutex<HyperClientRuntime>);
unsafe impl Send for HyperClient {}
unsafe impl Sync for HyperClient {}
impl Deref for HyperClient {
	type Target = Mutex<HyperClientRuntime>;
	fn deref(&self) -> &Self::Target {
		&self.0
	}
}
impl DerefMut for HyperClient {
	fn deref_mut(&mut self) -> &mut Self::Target {
		&mut self.0
	}
}
impl Finalize for HyperClient {
	fn finalize<'a, C: Context<'a>>(self, cx: &mut C) {
		current_runtime(cx).spawn(async move {
			self.lock().await.connections.clear();
		});
	}
}

impl HyperClientRuntime {
	async fn initiate_connection(
		&mut self,
		url: &Uri,
	) -> Result<&mut SendRequest<RequestBody>, String> {
		let host = url
			.host()
			.ok_or_else(|| String::from("Missing host in URL"))?;
		let port = url.port_u16().unwrap_or(80);
		let full_address = format!("{}:{}", host, port);

		// Check to see if we both have an existing connection w/ handshake, or
		// if we need to create a new connection (either closed pipe or no pipe)
		let entry = self.connections.entry(full_address.clone());
		let invalid = match entry {
			Entry::Occupied(mut entry) => {
				if entry.get().0.is_closed() {
					entry.get_mut().1.abort();
					entry.remove();
					true
				} else {
					false
				}
			}
			Entry::Vacant(_) => true,
		};

		// No valid connection found, so create a new one
		if invalid {
			let stream = TcpStream::connect(&full_address)
				.await
				.map_err(|e| e.to_string())?;
			let io_connector = TokioIo::new(stream);

			let (sender, conn) = hyper::client::conn::http1::handshake(io_connector)
				.await
				.map_err(|e| e.to_string())?;

			let conn_handle = tokio::task::spawn(async move { if let Err(_err) = conn.await {} });

			self.connections
				.insert(full_address.clone(), (sender, conn_handle));
			self.connections
				.get_mut(&full_address)
				.ok_or_else(|| String::from("Invalid connection found"))
				.map(|(sender, _)| sender)
		} else if let Some((sender, _)) = self.connections.get_mut(&full_address) {
			Ok(sender)
		} else {
			Err(String::from("Invalid connection found"))
		}
	}
}

pub fn client_new(mut cx: FunctionContext) -> JsResult<BoxedClient> {
	let client = Mutex::new(HyperClientRuntime {
		connections: Default::default(),
	});
	Ok(cx.boxed(Arc::new(HyperClient(client))))
}

pub fn client_request(mut cx: FunctionContext) -> JsResult<JsUndefined> {
	let client = cx.argument::<BoxedClient>(0)?;
	let client = (**client).clone();
	let method = cx.argument::<JsString>(1)?.value(&mut cx);
	let url = cx.argument::<JsString>(2)?.value(&mut cx);
	let headers = cx.argument::<JsObject>(3)?;
	let body_value = cx.argument::<JsValue>(4)?;
	let body = serialise_body(&mut cx, &body_value)?;
	let callback = cx.argument::<JsFunction>(5)?.root(&mut cx);

	let mut hyper_headers = object_to_headers(&mut cx, &headers)?;
	let hyper_url = url
		.parse::<Uri>()
		.map_err(|e| throw_generic_error(&mut cx, e))?;

	let hyper_method = match hyper::Method::from_str(&method) {
		Ok(method) => method,
		Err(_) => cx.throw_type_error("Unrecognised HTTP method")?,
	};

	let channel = cx.channel();

	current_runtime(&mut cx).spawn(async move {
		let mutex = &client.0;
		let mut client = mutex.lock().await;

		let sender = throw_channel_error!(
			channel,
			callback,
			client.initiate_connection(&hyper_url).await
		);
		let authority: Authority = throw_channel_error!(
			channel,
			callback,
			hyper_url.authority(),
			"Missing host in url"
		)
		.clone();
		let authority_header_value =
			throw_channel_error!(channel, callback, HeaderValue::from_str(authority.as_str()));

		hyper_headers.insert(header::HOST, authority_header_value);

		let mut builder = Request::builder().method(hyper_method).uri(hyper_url);
		if let Some(req_headers) = builder.headers_mut() {
			req_headers.extend(hyper_headers);
		}

		let request = throw_channel_error!(channel, callback, builder.body(body));
		let mut response: Response<Incoming> =
			throw_channel_error!(channel, callback, sender.send_request(request).await);
		let res_headers = response.headers().clone();

		let buffer_len = if let Some(content_length) = res_headers.get(header::CONTENT_LENGTH) {
			content_length.to_str().unwrap().parse::<usize>().unwrap()
		} else {
			0
		};

		let mut buffer = Vec::with_capacity(buffer_len);

		while let Some(next) = response.frame().await {
			let frame = throw_channel_error!(channel, callback, next);
			if let Some(chunk) = frame.data_ref() {
				let chunk: &Bytes = chunk;
				let _ = std::io::Write::write_all(&mut buffer, chunk);
			}
		}

		let header_map = Headers::from(res_headers);

		channel.send(move |mut cx| {
			let callback = callback.into_inner(&mut cx);
			let this = cx.undefined();
			let no_err = cx.null().upcast();

			let output = cx.empty_object();
			let status_code = cx.number(response.status().as_u16());
			let body = JsTypedArray::<u8>::from_slice(&mut cx, &buffer)?;
			let headers = header_map.as_object(&mut cx)?;

			output.set(&mut cx, "status", status_code)?;
			output.set(&mut cx, "body", body)?;
			output.set(&mut cx, "headers", headers)?;

			callback.call(&mut cx, this, vec![no_err, output.upcast()])?;
			Ok(())
		});
	});

	Ok(cx.undefined())
}
