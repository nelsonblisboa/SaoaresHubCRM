from fastapi import FastAPI
from instagrapi import Client
import os
import uvicorn

app = FastAPI()

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/prospect")
async def prospect_account(target: str, limit: int = 50):
    client = Client()
    
    # Configuração de credenciais (em produção, usar variáveis de ambiente)
    instagram_username = os.getenv("INSTAGRAM_USERNAME")
    instagram_password = os.getenv("INSTAGRAM_PASSWORD")
    
    if not instagram_username or not instagram_password:
        return {"error": "Instagram credentials not configured"}
    
    try:
        # Login no Instagram
        client.login(instagram_username, instagram_password)
        
        # Simulação de mineração (em produção, implementar lógica real)
        followers = [
            {"username": f"user{i}", "bio": f"Bio {i}", "location": "São Paulo"}
            for i in range(min(limit, 10))
        ]
        
        # Filtrar e armazenar no Supabase (simulado)
        filtered_contacts = [f for f in followers if "nutrition" in f["bio"].lower()]
        
        return {"prospected": len(filtered_contacts), "contacts": filtered_contacts}
        
    except Exception as e:
        return {"error": f"Instagram API error: {str(e)}"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)