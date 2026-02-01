pub mod patreon;
pub mod sidecar;
pub mod youtube;

pub use patreon::PatreonFetcher;
pub use sidecar::get_ytdlp_path;
pub use youtube::YouTubeFetcher;
