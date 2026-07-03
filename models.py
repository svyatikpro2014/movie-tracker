from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from database import Base



class UsersModel(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key = True) 
    email: Mapped[str] = mapped_column()
    password: Mapped[str] = mapped_column()


class MoviesModel(Base):
    __tablename__ = "films"
    id: Mapped[int] = mapped_column(primary_key=True)
    film_name: Mapped[str] = mapped_column()
    status: Mapped[str] = mapped_column()
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))