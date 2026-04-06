from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from database import get_db_connection
import auth

router = APIRouter(prefix="/auth", tags=["auth"])

class UserAuth(BaseModel):
    username: str
    password: str

@router.post("/register")
async def register(user: UserAuth):
    async with get_db_connection() as conn:
        async with conn.execute("SELECT 1 FROM users WHERE username = ?", (user.username,)) as cursor:
            existing = await cursor.fetchone()
            if existing:
                return JSONResponse(status_code=400, content={"error": "Username already taken"})
        
        hashed_pw = auth.get_password_hash(user.password)
        await conn.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (user.username, hashed_pw))
        await conn.commit()
    
    return {"message": "User registered successfully"}

@router.post("/login")
async def login(user: UserAuth):
    async with get_db_connection() as conn:
        async with conn.execute("SELECT * FROM users WHERE username = ?", (user.username,)) as cursor:
            row = await cursor.fetchone()
    
    if not row or not auth.verify_password(user.password, row['password_hash']):
        return JSONResponse(status_code=401, content={"error": "Invalid credentials"})
    
    token = auth.create_access_token({"sub": user.username, "role": row['role']})
    return {"access_token": token, "token_type": "bearer", "username": user.username}
