from app.core.config import Settings


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
