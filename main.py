from fastapi import FastAPI
from database import setup_database
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from routers.movies import router as movies_router
from routers.auth import router as auth_router
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(movies_router)
app.include_router(auth_router)

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.on_event("startup")
async def startup():
    await setup_database()


@app.get("/")
async def root():
    return FileResponse("static/index.html")


if __name__ == "__main__":
    uvicorn.run(app="main:app", reload=True)