from fastapi import FastAPI
from pydantic import BaseModel


app = FastAPI()

lst = [] # Это типа бд

class User(BaseModel):
    id: int
    name: str
    email: str
    password: str

class ReadUser(User):
    pass

class CreateUser(User):
    pass

class UpdateUser(BaseModel):
    id : int = None
    name : str = None
    email : str = None
    password: str = None

class DeleteUser(BaseModel):
    id: int

@app.post('/users')
async def create_user(user: CreateUser):
    if user not in lst:
        lst.append(user)

    return {'id': user.id, 'name': user.name, 'email': user.email, 'password': ''}

@app.get('/users')
async def get_users():
    print(lst)
    return {'users': lst}

@app.put('/users')
async def update_user(user: UpdateUser):
    if user in lst:
        lst.remove(user)
    lst.append(user)

    return {'id': user.id, 'name': user.name, 'email': user.email, 'password': ''}


@app.delete('/users')
async def delete_user(user_id: DeleteUser):  # Проще передавать ID параметром
    for i, existing_user in enumerate(lst):
        if existing_user.id == user_id.id:
            lst.pop(i)
            return {'message': f'user {user_id} deleted'}

    return {"error": "User not found"}