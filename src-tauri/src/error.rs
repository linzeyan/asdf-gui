use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("asdf binary not found: {0}")]
    AsdfNotFound(String),

    #[error("asdf command failed (exit {exit_code}): {stderr}")]
    AsdfError { exit_code: i32, stderr: String },

    #[error("process error: {0}")]
    ProcessError(String),

    #[error("parse error: {0}")]
    ParseError(String),

    #[error("config error: {0}")]
    ConfigError(String),

    #[error("{0}")]
    Io(#[from] std::io::Error),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
