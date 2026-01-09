# Руководство по разработке

## Как добавлять новые фичи

### 1. Backend (FastAPI)

#### Добавление нового API endpoint

1. **Создайте роутер** (если нужен новый модуль):
   ```python
   # app/routers/new_feature.py
   from fastapi import APIRouter, Depends
   from app.api.dependencies import get_db, get_current_user
   
   router = APIRouter(prefix="/new-feature", tags=["new-feature"])
   
   @router.get("/")
   async def get_items(db: AsyncSession = Depends(get_db)):
       # Ваш код
       pass
   ```

2. **Подключите роутер** в `app/main.py`:
   ```python
   from app.routers.new_feature import router as new_feature_router
   
   app.include_router(new_feature_router)
   ```

3. **Создайте схемы** в `app/schemas/`:
   ```python
   # app/schemas/new_feature.py
   from pydantic import BaseModel
   
   class ItemCreate(BaseModel):
       name: str
       value: int
   
   class ItemRead(BaseModel):
       id: int
       name: str
       value: int
   ```

4. **Создайте модель** (если нужна БД):
   ```python
   # app/models/new_feature.py
   from sqlalchemy.orm import Mapped, mapped_column
   from .base import Base
   
   class Item(Base):
       __tablename__ = "items"
       id: Mapped[int] = mapped_column(primary_key=True)
       name: Mapped[str]
       value: Mapped[int]
   ```

5. **Создайте миграцию**:
   ```bash
   docker-compose exec backend python -m alembic revision --autogenerate -m "add items table"
   docker-compose exec backend python -m alembic upgrade head
   ```

#### Добавление CRUD операций

1. **Создайте CRUD функции** в `app/crud/`:
   ```python
   # app/crud/new_feature.py
   from sqlalchemy.ext.asyncio import AsyncSession
   from app.models.new_feature import Item
   from app.schemas.new_feature import ItemCreate
   
   async def create_item(db: AsyncSession, item_data: ItemCreate):
       item = Item(**item_data.model_dump())
       db.add(item)
       await db.commit()
       await db.refresh(item)
       return item
   ```

2. **Используйте в роутере**:
   ```python
   from app.crud import new_feature as crud
   
   @router.post("/", response_model=ItemRead)
   async def create_item(item: ItemCreate, db: AsyncSession = Depends(get_db)):
       return await crud.create_item(db, item)
   ```

### 2. Frontend (React + TypeScript)

#### Добавление нового API вызова

1. **Создайте API функцию** в `src/api/`:
   ```typescript
   // src/api/newFeature.ts
   import { api } from './config';
   
   export interface Item {
     id: number;
     name: string;
     value: number;
   }
   
   export async function getItems(): Promise<Item[]> {
     const response = await api.get<Item[]>('/new-feature/');
     return response.data;
   }
   ```

2. **Создайте страницу/компонент**:
   ```typescript
   // src/pages/NewFeature.tsx
   import { useEffect, useState } from 'react';
   import { getItems } from '../api/newFeature';
   
   export function NewFeature() {
     const [items, setItems] = useState<Item[]>([]);
     
     useEffect(() => {
       getItems().then(setItems);
     }, []);
     
     return <div>{/* Ваш UI */}</div>;
   }
   ```

3. **Добавьте роут** в `src/App.tsx`:
   ```typescript
   import { NewFeature } from './pages/NewFeature';
   
   <Route path="/new-feature" element={<NewFeature />} />
   ```

#### Добавление нового компонента

1. **Создайте компонент** в `src/components/`:
   ```typescript
   // src/components/NewComponent.tsx
   interface NewComponentProps {
     title: string;
   }
   
   export function NewComponent({ title }: NewComponentProps) {
     return <div>{title}</div>;
   }
   ```

2. **Используйте в страницах**:
   ```typescript
   import { NewComponent } from '../components/NewComponent';
   
   <NewComponent title="Hello" />
   ```

### 3. Рабочий процесс

#### Типичный процесс добавления фичи:

1. **Создайте ветку**:
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Разработайте на бэкенде**:
   - Модель → Схема → CRUD → Роутер → Тестирование

3. **Разработайте на фронтенде**:
   - API функция → Типы → Компонент → Страница → Тестирование

4. **Протестируйте интеграцию**:
   - Проверьте работу через браузер
   - Проверьте логи в Docker

5. **Создайте миграции** (если нужно):
   ```bash
   docker-compose exec backend python -m alembic revision --autogenerate -m "add new feature"
   docker-compose exec backend python -m alembic upgrade head
   ```

6. **Закоммитьте изменения**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

### 4. Структура проекта

```
project_finance/
├── project_finance_backend/
│   ├── app/
│   │   ├── api/          # Зависимости (get_db, get_current_user)
│   │   ├── bot/          # Telegram bot
│   │   ├── core/         # Конфигурация, безопасность
│   │   ├── crud/         # CRUD операции
│   │   ├── models/       # SQLAlchemy модели
│   │   ├── routers/     # API роутеры
│   │   └── schemas/     # Pydantic схемы
│   ├── alembic/         # Миграции БД
│   └── pyproject.toml   # Зависимости Python
│
└── project_finance_front/
    ├── src/
    │   ├── api/         # API функции
    │   ├── components/  # React компоненты
    │   ├── contexts/    # React Context
    │   ├── hooks/       # Custom hooks
    │   ├── pages/       # Страницы
    │   ├── types/       # TypeScript типы
    │   └── utils/       # Утилиты
    └── package.json     # Зависимости Node.js
```

### 5. Полезные команды

#### Backend

```bash
# Запуск локально (без Docker)
cd project_finance_backend
poetry install
poetry run uvicorn app.main:app --reload

# Миграции
poetry run alembic revision --autogenerate -m "description"
poetry run alembic upgrade head

# Тестирование
poetry run pytest
```

#### Frontend

```bash
# Запуск локально (без Docker)
cd project_finance_front
npm install
npm run dev

# Сборка для production
npm run build

# Линтинг
npm run lint
```

### 6. Best Practices

1. **Всегда создавайте миграции** при изменении моделей
2. **Используйте типы** на фронтенде для безопасности
3. **Валидируйте данные** на бэкенде через Pydantic
4. **Обрабатывайте ошибки** на фронтенде
5. **Логируйте важные события** на бэкенде
6. **Используйте async/await** для всех операций с БД
7. **Тестируйте API** через Swagger UI (http://localhost:8000/docs)

### 7. Отладка

#### Backend логи:
```bash
docker-compose logs -f backend
```

#### Frontend логи:
- Откройте DevTools в браузере (F12)
- Проверьте Console и Network вкладки

#### База данных:
```bash
# Подключиться к БД
docker-compose exec db psql -U finance_user -d finance_db

# Просмотр таблиц
\dt

# Просмотр данных
SELECT * FROM users;
```

### 8. Добавление зависимостей

#### Backend (Python):
```bash
# Добавьте в pyproject.toml
poetry add package-name

# Или для dev зависимостей
poetry add --group dev package-name

# Пересоберите Docker образ
docker-compose build backend
```

#### Frontend (Node.js):
```bash
# Добавьте пакет
cd project_finance_front
npm install package-name

# Или для dev зависимостей
npm install --save-dev package-name

# Пересоберите Docker образ
docker-compose build frontend
```

## Пример: Добавление новой фичи "Бюджеты"

### Backend:

1. **Модель** (`app/models/budget.py`):
```python
class Budget(Base):
    __tablename__ = "budgets"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str]
    amount: Mapped[float]
    period: Mapped[str]  # monthly, yearly
```

2. **Схема** (`app/schemas/budget.py`):
```python
class BudgetCreate(BaseModel):
    name: str
    amount: float
    period: str
```

3. **CRUD** (`app/crud/budget.py`):
```python
async def create_budget(db: AsyncSession, budget_data: BudgetCreate, user_id: int):
    budget = Budget(**budget_data.model_dump(), user_id=user_id)
    db.add(budget)
    await db.commit()
    return budget
```

4. **Роутер** (`app/routers/budget.py`):
```python
@router.post("/", response_model=BudgetRead)
async def create_budget(
    budget: BudgetCreate,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await crud.create_budget(db, budget, current_user.id)
```

### Frontend:

1. **API** (`src/api/budget.ts`):
```typescript
export async function createBudget(data: BudgetCreate): Promise<Budget> {
  const response = await api.post<Budget>('/budgets/', data);
  return response.data;
}
```

2. **Страница** (`src/pages/Budgets.tsx`):
```typescript
export function Budgets() {
  // Ваш код
}
```

3. **Роут** в `App.tsx`:
```typescript
<Route path="/budgets" element={<Budgets />} />
```

Готово! Теперь у вас есть полная фича "Бюджеты".

