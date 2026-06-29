from app.core.config import Settings, settings


def test_cors_origin_list_parses_comma_separated_origins() -> None:
    settings = Settings(cors_origins="http://localhost:5173, http://127.0.0.1:5173")

    assert settings.cors_origin_list == [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


def test_cors_origin_list_ignores_blank_items() -> None:
    settings = Settings(cors_origins="http://localhost:5173, ,  , http://127.0.0.1:5173,")

    assert settings.cors_origin_list == [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


def test_default_cors_origins_include_localhost_and_loopback_frontend() -> None:
    assert "http://localhost:5173" in settings.cors_origin_list
    assert "http://127.0.0.1:5173" in settings.cors_origin_list


def test_sqlalchemy_database_url_uses_psycopg_for_render_postgres_url() -> None:
    settings = Settings(database_url="postgresql://user:password@host:5432/toolvault")

    assert settings.sqlalchemy_database_url == "postgresql+psycopg://user:password@host:5432/toolvault"


def test_sqlalchemy_database_url_keeps_explicit_driver_url() -> None:
    settings = Settings(database_url="postgresql+psycopg://user:password@host:5432/toolvault")

    assert settings.sqlalchemy_database_url == "postgresql+psycopg://user:password@host:5432/toolvault"
