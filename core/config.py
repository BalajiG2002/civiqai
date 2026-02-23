from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Google APIs
    GOOGLE_MAPS_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    # Gmail OAuth
    GMAIL_CLIENT_ID: str = ""
    GMAIL_CLIENT_SECRET: str = ""
    GMAIL_REFRESH_TOKEN: str = ""
    GMAIL_USER_EMAIL: str = ""

    # Pub/Sub
    PUBSUB_PROJECT_ID: str = "civiqai"
    PUBSUB_TOPIC: str = "civiqai-complaints"

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    # App
    DATABASE_URL: str = "sqlite:///./civiqai.db"
    CLUSTER_RADIUS_M: int = 500
    CLUSTER_THRESHOLD: int = 3
    PREDICTION_THRESHOLD: int = 60
    P1_THRESHOLD: int = 80

settings = Settings()
