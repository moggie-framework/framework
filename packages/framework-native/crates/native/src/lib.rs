use neon::prelude::*;

pub(crate) mod helpers;
mod http_client;
pub(crate) mod http_types;

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
	cx.export_function("HttpClientCreate", http_client::client_new)?;
	cx.export_function("HttpClientRequest", http_client::client_request)?;
	Ok(())
}
