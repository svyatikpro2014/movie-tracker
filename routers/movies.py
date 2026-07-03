from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from database import get_session
from models import MoviesModel
from schemas import FilmAddSchema, FilmResponse, FilmUpdate
from routers.auth import get_current_user


router = APIRouter(prefix="/movies", tags=["movies"])


@router.get("/", response_model=list[FilmResponse])
async def get_movies(session: AsyncSession = Depends(get_session), current_user = Depends(get_current_user), status: str | None = None):
    query = select(MoviesModel).where(MoviesModel.user_id == current_user.id)
    
    if status:  
        query = query.where(MoviesModel.status == status)
        
    result = await session.execute(query)
    return result.scalars().all()


@router.post("/", response_model=FilmResponse)
async def create_movie(movie: FilmAddSchema, session: AsyncSession = Depends(get_session), current_user = Depends(get_current_user)):
    db_movie = MoviesModel(**movie.dict(), user_id=current_user.id)
    session.add(db_movie)
    await session.commit()
    await session.refresh(db_movie)
    return db_movie


@router.delete("/{movie_id}")
async def delete_movie(movie_id: int, session: AsyncSession = Depends(get_session), current_user = Depends(get_current_user)):
    result = await session.execute(select(MoviesModel).where(MoviesModel.id == movie_id))
    movie = result.scalar_one_or_none()
    
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    if movie.user_id != current_user.id: 
        raise HTTPException(status_code=403, detail="Not your movie")
    
    await session.delete(movie)
    await session.commit()
    return {"ok": True}


@router.patch("/{movie_id}")
async def update_movie(movie_id:int, movie_update: FilmUpdate, session: AsyncSession = Depends(get_session), current_user = Depends(get_current_user)):
    result = await session.execute(select(MoviesModel).where(MoviesModel.id == movie_id))
    movie_update = result.scalar_one_or_none()
    
    if not movie_update:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    if movie_update.user_id != current_user.id: 
        raise HTTPException(status_code=403, detail="Not your movie")
    
    movie_update.status = "Watched" 
    await session.commit()  
    await session.refresh(movie_update)
    return movie_update