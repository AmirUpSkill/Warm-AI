"""add FILE_SEARCH enum value

Revision ID: 8b8a0b4796e0
Revises: fe9dce86cd52
Create Date: 2025-12-23 18:45:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "8b8a0b4796e0"
down_revision: Union[str, Sequence[str], None] = "fe9dce86cd52"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add FILE_SEARCH to chatmode enum."""
    op.execute("ALTER TYPE chatmode ADD VALUE IF NOT EXISTS 'FILE_SEARCH'")


def downgrade() -> None:
    """Enum value removal is not supported automatically."""
    # PostgreSQL does not support removing enum values easily; leave as-is.
    pass
