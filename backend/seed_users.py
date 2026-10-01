import logging
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.database import SessionLocal, create_database
from models.user import User, UserRole

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_users():
    create_database()
    
    db = SessionLocal()
    try:
        existing_users = db.query(User).count()
        if existing_users > 0:
            logger.info(f"Database already contains {existing_users} users. Skipping seeding.")
            return

        users = [
            User(full_name="Alice Admin", email="alice@cleardesk.ai", role=UserRole.ADMIN),
            User(full_name="Bob Manager", email="bob@cleardesk.ai", role=UserRole.MANAGER),
            User(full_name="Charlie Member", email="charlie@cleardesk.ai", role=UserRole.MEMBER),
            User(full_name="Diana Member", email="diana@cleardesk.ai", role=UserRole.MEMBER),
        ]
        
        db.add_all(users)
        db.commit()
        
        for user in users:
            logger.info(f"Created user: {user.full_name} ({user.email}) - {user.role.value}")
            
        logger.info("Successfully seeded users!")
    except Exception as e:
        logger.error(f"Error seeding users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
