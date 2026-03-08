from app.main import app

# This file is a simple entry point that imports the FastAPI app from the app subdirectory
# This allows running the application with: uvicorn main:app --reload

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
