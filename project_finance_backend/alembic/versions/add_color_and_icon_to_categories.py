"""add color and icon to categories

Revision ID: add_color_icon
Revises: 5eae301d7ed1
Create Date: 2024-01-01 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_color_icon'
down_revision: Union[str, None] = '1b794a48fd55'  # Последняя миграция в цепочке
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add color and icon columns to categories table
    op.add_column('categories', sa.Column('color', sa.String(), nullable=True))
    op.add_column('categories', sa.Column('icon', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove color and icon columns from categories table
    op.drop_column('categories', 'icon')
    op.drop_column('categories', 'color')

