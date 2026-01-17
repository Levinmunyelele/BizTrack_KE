import sys
import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# 1️⃣ Add the backend folder to the Python path so imports work
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# 2️⃣ Import your Base and models
from app.db.base import Base
from app.models import User, Business  # Only existing models for now

# 3️⃣ Alembic Config object
config = context.config

# 4️⃣ Set up Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 5️⃣ Set the target metadata for autogenerate
target_metadata = Base.metadata

# 6️⃣ Offline migration
def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

# 7️⃣ Online migration
def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

# 8️⃣ Run migrations
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
