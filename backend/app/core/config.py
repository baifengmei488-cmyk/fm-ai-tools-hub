from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite+pysqlite:///./toolvault.db"
    secret_key: str = "toolvault-local-development-secret"
    admin_username: str = "admin"
    admin_password: str = "toolvault-admin-local"
    cors_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_prefix="TOOLVAULT_", env_file=".env")


settings = Settings()
