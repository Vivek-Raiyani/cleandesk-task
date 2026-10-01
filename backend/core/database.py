import logging
from .settings import settings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base

logger = logging.getLogger(__name__)

engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_database():
    """Create all database tables"""
    logger.info("Connecting to database")
    Base.metadata.create_all(engine)
    logger.info("Database tables created successfully")