"""Add agent and agentcontext tables

Revision ID: a1b2c3d4e5f6
Revises: fe9dce86cd52
Create Date: 2026-01-03 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '8b8a0b4796e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create agent table
    op.create_table(
        'agent',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('avatar_url', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('instructions', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('guardrails', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('tone', sqlmodel.sql.sqltypes.AutoString(), nullable=False, server_default='professional'),
        sa.Column('custom_tone', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create agentcontext table
    op.create_table(
        'agentcontext',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('agent_id', sa.Integer(), nullable=False),
        sa.Column('file_name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('file_search_store_name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['agent_id'], ['agent.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Add agent_id column to session table
    op.add_column('session', sa.Column('agent_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_session_agent_id',
        'session', 'agent',
        ['agent_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    # Remove foreign key and column from session
    op.drop_constraint('fk_session_agent_id', 'session', type_='foreignkey')
    op.drop_column('session', 'agent_id')
    
    # Drop tables
    op.drop_table('agentcontext')
    op.drop_table('agent')
