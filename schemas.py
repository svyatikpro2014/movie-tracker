from pydantic import BaseModel, EmailStr, SecretStr, Field
from typing import Literal


class UserAddSchema(BaseModel):
    email: EmailStr
    password: SecretStr = Field(min_length=6, max_length=72)


class UserResponse(BaseModel):
    id: int
    email: str
    


class FilmAddSchema(BaseModel):
    film_name: str = Field(min_length=1, max_length=40)
    status: Literal["Watched", "Want_to_watch"]



class FilmResponse(BaseModel):
    id: int
    film_name: str
    status: Literal["Watched", "Want_to_watch"]
    user_id: int


class FilmUpdate(BaseModel):
    status: Literal["Watched", "Want_to_watch"]