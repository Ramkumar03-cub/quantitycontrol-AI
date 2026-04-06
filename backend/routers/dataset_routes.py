from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from state import dataset_manager, cv_engine, ai_engine

router = APIRouter(prefix="/dataset", tags=["dataset"])

class DatasetConfig(BaseModel):
    profile_name: str

class NewDatasetConfig(BaseModel):
    name: str
    defects: list
    good_criteria: str

class LabelsPayload(BaseModel):
    profile_name: str
    filename: str
    labels: list


@router.get("/profiles")
async def get_profiles():
    profiles = await dataset_manager.get_profiles()
    return {"profiles": profiles}

@router.post("/load")
async def load_dataset(config: DatasetConfig):
    profile = await dataset_manager.load_profile(config.profile_name)
    if profile:
        cv_engine.defect_types = profile["defects"]
    cv_engine.load_profile_model(config.profile_name)
    ai_engine.update_context(config.profile_name, "Specific Material") 
    return {"message": f"Loaded dataset profile: {config.profile_name}", "profile": profile}

@router.post("/create")
async def create_dataset(config: NewDatasetConfig):
    await dataset_manager.create_profile(config.name, config.defects, config.good_criteria)
    return {"message": f"Created new dataset profile: {config.name}"}

@router.post("/upload")
async def upload_training_images(
    file: UploadFile = File(...),
    profile_name: str = Form(...),
    category: str = Form(...)
):
    contents = await file.read()
    success, message = await dataset_manager.save_image(profile_name, category, contents, file.filename)
    
    if success:
        return {"message": f"Successfully uploaded {file.filename}", "path": message}
    else:
        return JSONResponse(status_code=400, content={"error": message})

@router.post("/labels")
async def upload_labels(payload: LabelsPayload):
    success, message = await dataset_manager.save_labels(
        payload.profile_name, 
        payload.filename, 
        payload.labels
    )
    if success:
        return {"message": "Labels saved"}
    else:
        return JSONResponse(status_code=400, content={"error": message})


@router.post("/upload_zip")
async def upload_zip_dataset(
    file: UploadFile = File(...),
    profile_name: str = Form(...)
):
    if not file.filename.lower().endswith('.zip'):
        return JSONResponse(status_code=400, content={"error": "Must be a .zip file (case-insensitive)"})

        
    contents = await file.read()
    success, message, yaml_path = dataset_manager.extract_zip_dataset(profile_name, contents)
    
    if success:
        return {"message": message, "yaml_path": yaml_path}
    else:
        return JSONResponse(status_code=400, content={"error": message})
