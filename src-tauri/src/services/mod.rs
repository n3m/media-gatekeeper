pub mod patreon;
pub mod sidecar;
pub mod youtube;

pub use patreon::PatreonFetcher;
pub use sidecar::{get_ffmpeg_path, get_ytdlp_path, is_ffmpeg_available};
pub use youtube::YouTubeFetcher;
