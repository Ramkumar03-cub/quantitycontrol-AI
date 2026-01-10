from passlib.context import CryptContext
import traceback

print("Initializing CryptContext...")
try:
    pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
    print("CryptContext initialized.")
    
    password = "testpassword123"
    print(f"Hashing password: {password}")
    hashed = pwd_context.hash(password)
    print(f"Hashed: {hashed}")
    
    print("Verifying...")
    is_valid = pwd_context.verify(password, hashed)
    print(f"Verified: {is_valid}")
    
except Exception as e:
    print(f"Error: {e}")
    traceback.print_exc()
