pub mod routes;
pub mod utils;
pub mod fairings;
pub mod site_metadata;
pub mod errors;

use fairings::stage_templates;
use rocket::{fs::FileServer, routes as rroutes, Build, Rocket};
use routes::index::index_page;

pub fn init_rocket(rocket: Rocket<Build>) -> Rocket<Build> {
    rocket.attach(stage_templates())
    .mount("/dist", FileServer::from("client/dist"))
    .mount("/assets", FileServer::from("client/assets"))
    .mount("/", rroutes![index_page])
}
