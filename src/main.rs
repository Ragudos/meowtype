use meowtype::init_rocket;
use rocket::Rocket;

#[macro_use]
extern crate rocket;

#[launch]
async fn rocket() -> _ {
    init_rocket(Rocket::build())
}
