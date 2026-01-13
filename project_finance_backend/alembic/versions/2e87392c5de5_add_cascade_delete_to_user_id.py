"""add_cascade_delete_to_user_id

Revision ID: 2e87392c5de5
Revises: e0373696d13f
Create Date: 2025-12-30 12:24:51.378891

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2e87392c5de5"
down_revision: Union[str, Sequence[str], None] = "e0373696d13f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Удаляем старое ограничение (имя возьмите из ошибки: categories_user_id_fkey)
    op.drop_constraint("categories_user_id_fkey", "categories", type_="foreignkey")

    # 2. Создаем новое ограничение с добавленным ondelete='CASCADE'
    op.create_foreign_key(
        "categories_user_id_fkey",  # имя ключа
        "categories",  # таблица, в которой создаем (ребенок)
        "users",  # таблица, на которую ссылаемся (родитель)
        ["user_id"],  # столбец в текущей таблице
        ["id"],  # столбец в родительской таблице
        ondelete="CASCADE",  # САМОЕ ВАЖНОЕ
    )


def downgrade() -> None:
    # Возвращаем всё как было (удаляем каскадное, ставим обычное)
    op.drop_constraint("categories_user_id_fkey", "categories", type_="foreignkey")
    op.create_foreign_key(
        "categories_user_id_fkey", "categories", "users", ["user_id"], ["id"]
    )
