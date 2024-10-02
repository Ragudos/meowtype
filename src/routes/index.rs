use rocket::{
    get,
    http::{CookieJar, Status},
};
use rocket_dyn_templates::{context, Template};

use crate::site_metadata::{SeoMetadataBuilder, Theme};

#[get("/?<room_id>")]
pub fn index_page(cookie_jar: &CookieJar<'_>, room_id: Option<String>) -> Result<Template, Status> {
    let theme = Theme::from_cookie_jar(cookie_jar);
    let metadata = SeoMetadataBuilder::default().theme(theme).build().unwrap();

    Ok(Template::render("index", context! { room_id, metadata }))
}
