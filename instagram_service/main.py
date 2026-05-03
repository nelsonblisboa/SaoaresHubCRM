"""
SOARES HUB CRM - Instagram Service (v1.0)
Microserviço para prospecção e automação Instagram usando instagrapi

Endpoints:
- POST /prospect       : Mineração de seguidores e geração de leads
- POST /engage        : Automação de engajamento (likes, follow)
- POST /dm/send        : Envio de DMs para leads
- GET  /health         : Health check
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from app.prospector import InstagramProspector
from app.dm_sender import DMSender

load_dotenv()

app = FastAPI(
    title="SOARES HUB CRM - Instagram Service",
    description="Microserviço para prospecção Instagram",
    version="1.0.0"
)

# API Key security
API_KEY = os.getenv("INSTAGRAM_SERVICE_KEY", "soares-hub-instagram-secret-2026")
api_key_header = APIKeyHeader(name="X-API-Key")

def verify_api_key(key: str = Depends(api_key_header)):
    if key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return key

# Models
class ProspectRequest(BaseModel):
    target_username: str
    limit: int = 50
    organization_id: str
    send_dm: bool = False
    dm_template: Optional[str] = None

class EngageRequest(BaseModel):
    target_username: str
    actions: List[str] = ["follow", "like"]
    limit: int = 20

class DMRequest(BaseModel):
    username: str
    message: str
    organization_id: str

class ProspectResponse(BaseModel):
    status: str
    total_found: int
    total_saved: int
    leads: List[dict]
    errors: List[str] = []

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "instagram-service", "version": "1.0.0"}

@app.post("/prospect", dependencies=[Depends(verify_api_key)])
async def prospect_leads(request: ProspectRequest, background_tasks: BackgroundTasks):
    """
    Mineração de seguidores de um perfil alvo.
    Executa em background para evitar timeout.
    """
    try:
        prospector = InstagramProspector()
        
        # Adiciona tarefa em background
        background_tasks.add_task(
            prospector.prospect,
            target_username=request.target_username,
            limit=request.limit,
            organization_id=request.organization_id,
            send_dm=request.send_dm,
            dm_template=request.dm_template
        )
        
        return {
            "status": "accepted",
            "message": f"Prospection started for @{request.target_username}",
            "job_id": f"prosp_{request.target_username}_{request.limit}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/engage", dependencies=[Depends(verify_api_key)])
async def engage_target(request: EngageRequest):
    """
    Automação de engajamento: follow, likes, comments.
    """
    try:
        prospector = InstagramProspector()
        results = await prospector.engage(
            target_username=request.target_username,
            actions=request.actions,
            limit=request.limit
        )
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/dm/send", dependencies=[Depends(verify_api_key)])
async def send_dm(request: DMRequest):
    """
    Envio de DM para um usuário específico.
    """
    try:
        dm_sender = DMSender()
        result = await dm_sender.send_dm(
            username=request.username,
            message=request.message,
            organization_id=request.organization_id
        )
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/prospect/status/{job_id}", dependencies=[Depends(verify_api_key)])
async def get_prospect_status(job_id: str):
    """Consulta status de uma tarefa de prospecção"""
    # Em produção, consultaria Redis/DB para status real
    return {
        "job_id": job_id,
        "status": "running",  # Simulado
        "progress": 50
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
