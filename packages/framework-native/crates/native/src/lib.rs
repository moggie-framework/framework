use neon::prelude::*;

mod http_client;
pub(crate) mod http_types;
pub(crate) mod helpers;

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    let runtime = match tokio::runtime::Runtime::new() {
        Ok(rt) => rt,
        Err(e) => return cx.throw_error(format!("Error creating Tokio runtime: {}", e)),
    };
    // neon::set_global_executor(&mut cx, runtime).unwrap();

    cx.export_function("HttpClientCreate", http_client::client_new)?;
    cx.export_function("HttpClientRequest", http_client::client_request)?;
    Ok(())
}
