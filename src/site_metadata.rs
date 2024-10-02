use derive_builder::Builder;
use rocket::http::CookieJar;
use serde::{Deserialize, Serialize};


#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum Theme {
    #[serde(rename = "light")]
    Light,
    #[serde(rename = "dark")]
    Dark,
    #[serde(rename = "system")]
    System
}

impl Default for Theme {
    fn default() -> Self {
        Theme::System
    }
}

impl Theme {
    pub fn from_cookie_jar(cookie_jar: &CookieJar<'_>) -> Self {
        cookie_jar
            .get("meowtype_color_scheme")
            .map_or("system", |cookie| cookie.value_trimmed())
            .into()
    }
}

impl From<&str> for Theme {
    fn from(value: &str) -> Self {
        match value {
            "light" => Theme::Light,
            "dark" => Theme::Dark,
            "system" | _ => Theme::System
        }
    }
}

impl From<Theme> for &'static str {
    fn from(value: Theme) -> Self {
        match value {
            Theme::Light => "light",
            Theme::Dark => "dark",
            Theme::System => "system"
        }
    }
}

#[derive(Builder, Serialize, Deserialize, Debug,  Clone)]
pub struct OpengraphImage {
    pub url: String,
    pub alt: String,
    pub width: u32,
    pub height: u32
}

#[derive(Builder, Serialize, Deserialize, Debug,  Clone)]
pub struct OpengraphMetadata {
    pub title: String,
    pub description: String,
    pub image: Option<OpengraphImage>,
    pub url: String
}

/// TODO: get default title, description, and og from a config file.
/// And option to have absolute or relative titles, etc.
#[derive(Builder, Serialize, Deserialize, Debug,  Clone)]
pub struct SeoMetadata {
    #[builder(default = "\"MeowType\".to_string()")]
    pub title: String,
    #[builder(default = "\"Challenge your typing speed and skills at MeowType.\".to_string()")]
    pub description: String,
    #[builder(default = "None")]
    pub open_graph: Option<OpengraphMetadata>,
    #[builder(default = "Theme::System")]
    pub theme: Theme
}
