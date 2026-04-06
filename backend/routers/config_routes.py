from fastapi import APIRouter
from pydantic import BaseModel
from state import sensor_sim, ai_engine, cv_engine

router = APIRouter(prefix="/config", tags=["config"])

class SystemConfig(BaseModel):
    defect_probability: float

class ProductConfig(BaseModel):
    name: str
    material: str

@router.post("")
async def update_config(config: SystemConfig):
    sensor_sim.update_params(defect_prob=config.defect_probability)
    return {"message": "Configuration updated", "config": config}

@router.post("/product")
async def update_product(config: ProductConfig):
    ai_engine.update_context(config.name, config.material)
    cv_engine.update_product_context(config.name, config.material)
    return {"message": f"Product context updated to {config.name} ({config.material})"}
