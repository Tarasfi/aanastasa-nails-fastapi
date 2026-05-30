import os
import jwt
from starlette import status
from app.database import get_db
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.models.admin import Admin

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")


def get_current_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    invalid_token_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credential verification failed (Invalid Token)",
        headers={"WWW-Authenticate": "Bearer"},
    )
    invalid_admin_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid admin (Admin not found or credentials are wrong)",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        token_username: str = payload.get("sub")
        if token_username is None:
            raise invalid_token_exception
    except jwt.PyJWTError:
        raise invalid_token_exception

    admin = db.query(Admin).filter(Admin.username == token_username).first()

    if admin is None:
        raise invalid_admin_exception
    return admin
