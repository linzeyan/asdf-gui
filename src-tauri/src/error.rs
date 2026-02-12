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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_display_asdf_not_found() {
        let err = AppError::AsdfNotFound("binary missing".to_string());
        assert_eq!(err.to_string(), "asdf binary not found: binary missing");
    }

    #[test]
    fn test_display_asdf_error() {
        let err = AppError::AsdfError {
            exit_code: 1,
            stderr: "command failed".to_string(),
        };
        assert_eq!(
            err.to_string(),
            "asdf command failed (exit 1): command failed"
        );
    }

    #[test]
    fn test_display_process_error() {
        let err = AppError::ProcessError("spawn failed".to_string());
        assert_eq!(err.to_string(), "process error: spawn failed");
    }

    #[test]
    fn test_display_parse_error() {
        let err = AppError::ParseError("invalid format".to_string());
        assert_eq!(err.to_string(), "parse error: invalid format");
    }

    #[test]
    fn test_display_config_error() {
        let err = AppError::ConfigError("missing key".to_string());
        assert_eq!(err.to_string(), "config error: missing key");
    }

    #[test]
    fn test_from_io_error() {
        let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "file not found");
        let app_err: AppError = io_err.into();
        assert!(app_err.to_string().contains("file not found"));
    }

    #[test]
    fn test_serialize_to_json_string() {
        let err = AppError::AsdfNotFound("test".to_string());
        let json = serde_json::to_string(&err).unwrap();
        assert_eq!(json, "\"asdf binary not found: test\"");
    }

    #[test]
    fn test_serialize_asdf_error_to_json() {
        let err = AppError::AsdfError {
            exit_code: 127,
            stderr: "not found".to_string(),
        };
        let json = serde_json::to_string(&err).unwrap();
        assert!(json.contains("exit 127"));
        assert!(json.contains("not found"));
    }

    #[test]
    fn test_serialize_io_error_to_json() {
        let io_err = std::io::Error::new(std::io::ErrorKind::PermissionDenied, "access denied");
        let app_err: AppError = io_err.into();
        let json = serde_json::to_string(&app_err).unwrap();
        assert!(json.contains("access denied"));
    }

    #[test]
    fn test_error_debug_impl() {
        let err = AppError::ParseError("test".to_string());
        let debug = format!("{:?}", err);
        assert!(debug.contains("ParseError"));
    }

    #[test]
    fn test_asdf_error_negative_exit_code() {
        let err = AppError::AsdfError {
            exit_code: -1,
            stderr: "killed by signal".to_string(),
        };
        assert!(err.to_string().contains("exit -1"));
    }

    #[test]
    fn test_error_with_unicode() {
        let err = AppError::AsdfNotFound("找不到 asdf".to_string());
        let json = serde_json::to_string(&err).unwrap();
        assert!(json.contains("找不到"));
    }

    #[test]
    fn test_error_with_empty_message() {
        let err = AppError::ProcessError(String::new());
        assert_eq!(err.to_string(), "process error: ");
    }
}
