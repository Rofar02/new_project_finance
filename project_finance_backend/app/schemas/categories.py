from pydantic import BaseModel, ConfigDict


class CategoryBase(BaseModel):
    name: str
    type: str
    color: str | None = None
    icon: str | None = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    name: str | None = None
    type: str | None = None
    color: str | None = None
    icon: str | None = None


class CategoryRead(CategoryBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
