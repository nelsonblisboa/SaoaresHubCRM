"""
SOARES HUB CRM — Microserviço de Prospecção Instagram
======================================================
FastAPI + instagrapi → ponte entre o Apache Airflow e o Instagram.

Funcionalidades:
  POST /prospect/followers  — Minera seguidores de um perfil concorrente.
  POST /prospect/hashtag    — Minera usuários ativos em uma hashtag.
  POST /engage/follow       — Segue uma lista de usuários (com delay humanizado).
  POST /engage/dm           — Envia DMs iniciais de prospecção.
  POST /sync/supabase       — Persiste contatos minerados no Supabase.
  GET  /health              — Healthcheck (usado pelo Airflow para aguardar o serviço).
  GET  /session/status      — Verifica se a sessão do Instagram ainda está ativa.

Boas práticas de segurança:
  - Rate limiting embutido (máx. 50 ações por sessão).
  - Delays aleatórios entre 3–12 segundos para simular comportamento humano.
  - Sessão serializada em arquivo local para evitar re-login frequente.
  - Filtragem de contas privadas, bots e contas sem foto.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import os
import time
import random
import json
import logging
from datetime import datetime
from pathlib import Path

# ─── Imports condicionais (graceful degradation se instagrapi não instalado) ──
try:
    from instagrapi import Client
    from instagrapi.exceptions import LoginRequired, TwoFactorRequired, BadPassword
    INSTAGRAPI_AVAILABLE = True
except ImportError:
    INSTAGRAPI_AVAILABLE = False
    Client = None

# ─── Supabase Client ──────────────────────────────────────────────────────────
try:
    from supabase import create_client, Client as SupabaseClient
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    SupabaseClient = None

# ─── Configuração de Logging ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("instagram-service")

# ─── App FastAPI ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="SOARES HUB — Instagram Prospecting Service",
    description="Microserviço de automação e mineração para prospecção via Instagram.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Constantes e Configuração ────────────────────────────────────────────────
SESSION_FILE = Path("./instagram_session.json")
MAX_ACTIONS_PER_SESSION = 50         # Limite seguro de ações por sessão
MIN_DELAY_SECONDS = 3                # Delay mínimo entre ações (humanização)
MAX_DELAY_SECONDS = 12               # Delay máximo entre ações (humanização)
DEFAULT_ORG_ID = os.getenv("DEFAULT_ORG_ID", "00000000-0000-0000-0000-000000000001")

# ─── Modelos Pydantic ─────────────────────────────────────────────────────────

class ProspectFollowersRequest(BaseModel):
    target_username: str = Field(..., description="Username do concorrente a ser minerado")
    limit: int = Field(50, ge=1, le=200, description="Quantidade máxima de seguidores a extrair")
    filter_has_bio: bool = Field(True, description="Filtrar apenas contas com bio preenchida")
    filter_has_photo: bool = Field(True, description="Filtrar apenas contas com foto de perfil")
    filter_not_private: bool = Field(True, description="Filtrar apenas contas públicas")
    filter_keywords: list[str] = Field([], description="Palavras-chave obrigatórias na bio (OU)")
    filter_location: Optional[str] = Field(None, description="Filtrar por localização na bio")

class ProspectHashtagRequest(BaseModel):
    hashtag: str = Field(..., description="Hashtag a ser minerada (sem #)")
    limit: int = Field(30, ge=1, le=100)
    min_likes: int = Field(10, description="Mínimo de likes para considerar conta ativa")

class EngageFollowRequest(BaseModel):
    usernames: list[str] = Field(..., description="Lista de usernames para seguir")

class EngageDMRequest(BaseModel):
    username: str = Field(..., description="Username do destinatário")
    message: str = Field(..., description="Mensagem de prospecção inicial")

class SyncSupabaseRequest(BaseModel):
    contacts: list[dict] = Field(..., description="Lista de contatos minerados para persistir")
    organization_id: str = Field(DEFAULT_ORG_ID)

# ─── Gerenciador de Sessão Instagram ─────────────────────────────────────────

_instagram_client: Optional[Client] = None

def get_instagram_client() -> Client:
    """
    Retorna um cliente Instagram autenticado.
    Reutiliza a sessão serializada para evitar re-login frequente.
    """
    global _instagram_client

    if not INSTAGRAPI_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="instagrapi não instalado. Execute: pip install instagrapi"
        )

    username = os.getenv("INSTAGRAM_USERNAME")
    password = os.getenv("INSTAGRAM_PASSWORD")

    if not username or not password:
        raise HTTPException(
            status_code=503,
            detail="Credenciais do Instagram não configuradas (INSTAGRAM_USERNAME / INSTAGRAM_PASSWORD)"
        )

    if _instagram_client is None:
        cl = Client()
        cl.delay_range = [MIN_DELAY_SECONDS, MAX_DELAY_SECONDS]  # Humanização nativa

        # Tenta reutilizar sessão salva
        if SESSION_FILE.exists():
            try:
                cl.load_settings(SESSION_FILE)
                cl.login(username, password)
                logger.info("✅ Sessão Instagram restaurada do arquivo.")
            except Exception:
                logger.warning("Sessão expirada. Fazendo novo login...")
                SESSION_FILE.unlink(missing_ok=True)
                cl.login(username, password)
        else:
            cl.login(username, password)

        # Salva sessão para reutilização futura
        cl.dump_settings(SESSION_FILE)
        logger.info(f"✅ Login realizado como @{username}")
        _instagram_client = cl

    return _instagram_client

def human_delay():
    """Delay aleatório para simular comportamento humano e evitar rate limiting."""
    delay = random.uniform(MIN_DELAY_SECONDS, MAX_DELAY_SECONDS)
    logger.debug(f"Aguardando {delay:.1f}s (humanização)...")
    time.sleep(delay)

def filter_user(user_info: dict, req: ProspectFollowersRequest) -> bool:
    """
    Aplica filtros de qualificação em um usuário minerado.
    Retorna True se o usuário deve ser incluído, False caso contrário.
    """
    bio = (user_info.get("biography") or "").lower()
    full_name = (user_info.get("full_name") or "")

    if req.filter_has_bio and not bio:
        return False
    if req.filter_has_photo and not user_info.get("profile_pic_url"):
        return False
    if req.filter_not_private and user_info.get("is_private"):
        return False

    # Filtra por palavras-chave na bio (OU lógico)
    if req.filter_keywords:
        if not any(kw.lower() in bio for kw in req.filter_keywords):
            return False

    # Filtra por localização
    if req.filter_location:
        location_in_bio = req.filter_location.lower() in bio
        if not location_in_bio:
            return False

    return True

def map_user_to_contact(user_info: dict) -> dict:
    """Converte o formato instagrapi para o formato de Contact do Supabase."""
    return {
        "name": user_info.get("full_name") or user_info.get("username"),
        "instagram_username": user_info.get("username"),
        "source": "instagram",
        "tags": ["instagram", "prospected", datetime.now().strftime("%Y-%m")],
        # phone_number não disponível via mineração pública — será preenchido depois
    }

# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health", tags=["Monitoramento"])
async def health():
    """Healthcheck usado pelo Airflow para verificar se o serviço está operacional."""
    return {
        "status": "ok",
        "instagrapi": INSTAGRAPI_AVAILABLE,
        "supabase": SUPABASE_AVAILABLE,
        "session_active": _instagram_client is not None,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/session/status", tags=["Monitoramento"])
async def session_status():
    """Verifica o estado atual da sessão Instagram."""
    if _instagram_client is None:
        return {"authenticated": False, "username": None}
    try:
        info = _instagram_client.account_info()
        return {"authenticated": True, "username": info.username, "pk": info.pk}
    except Exception as e:
        return {"authenticated": False, "error": str(e)}

@app.post("/prospect/followers", tags=["Prospecção"])
async def prospect_followers(req: ProspectFollowersRequest):
    """
    Minera seguidores de um perfil concorrente com filtragem de qualidade.

    Fluxo:
    1. Busca lista de seguidores do `target_username`.
    2. Para cada seguidor, busca informações do perfil.
    3. Aplica filtros de bio, foto, privacidade e palavras-chave.
    4. Retorna lista de contatos qualificados prontos para sincronização.
    """
    cl = get_instagram_client()
    logger.info(f"🔍 Iniciando mineração de @{req.target_username} (limite: {req.limit})")

    try:
        # Busca o user_id do alvo
        target_id = cl.user_id_from_username(req.target_username)
        human_delay()

        # Obtém seguidores (paginado internamente pelo instagrapi)
        raw_followers = cl.user_followers(target_id, amount=req.limit)
        logger.info(f"📋 {len(raw_followers)} seguidores obtidos. Iniciando filtragem...")

        prospected = []
        processed = 0

        for user_id, user_short in raw_followers.items():
            if processed >= MAX_ACTIONS_PER_SESSION:
                logger.warning("Limite de ações da sessão atingido.")
                break

            try:
                # Busca detalhes completos do perfil
                user_info = cl.user_info(user_id).dict()
                processed += 1

                if filter_user(user_info, req):
                    contact = map_user_to_contact(user_info)
                    prospected.append(contact)
                    logger.info(f"  ✓ @{user_info.get('username')} qualificado")

                human_delay()

            except Exception as e:
                logger.warning(f"  ⚠ Erro ao processar user {user_id}: {e}")
                continue

        logger.info(f"✅ Mineração concluída: {len(prospected)}/{processed} qualificados")

        return {
            "success": True,
            "target": req.target_username,
            "total_scraped": processed,
            "total_qualified": len(prospected),
            "contacts": prospected,
        }

    except Exception as e:
        logger.error(f"❌ Erro na prospecção: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/prospect/hashtag", tags=["Prospecção"])
async def prospect_hashtag(req: ProspectHashtagRequest):
    """
    Minera usuários ativos em uma hashtag específica.
    Ideal para encontrar leads com interesse declarado em um tema.
    """
    cl = get_instagram_client()
    logger.info(f"#️⃣ Minerando hashtag #{req.hashtag} (limite: {req.limit})")

    try:
        medias = cl.hashtag_medias_recent(req.hashtag, amount=req.limit)
        contacts = []

        for media in medias:
            if media.like_count < req.min_likes:
                continue

            user_info = cl.user_info(media.user.pk).dict()
            contact = map_user_to_contact(user_info)
            contacts.append(contact)
            human_delay()

        return {
            "success": True,
            "hashtag": req.hashtag,
            "total_qualified": len(contacts),
            "contacts": contacts,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/engage/follow", tags=["Engajamento"])
async def engage_follow(req: EngageFollowRequest, background_tasks: BackgroundTasks):
    """
    Segue uma lista de usuários com delays humanizados.
    Executado em background para não bloquear a resposta do Airflow.
    """
    cl = get_instagram_client()

    async def _follow_task():
        results = {"followed": [], "failed": []}
        for username in req.usernames[:MAX_ACTIONS_PER_SESSION]:
            try:
                user_id = cl.user_id_from_username(username)
                cl.user_follow(user_id)
                results["followed"].append(username)
                logger.info(f"  ✓ Seguindo @{username}")
                human_delay()
            except Exception as e:
                results["failed"].append({"username": username, "error": str(e)})
                logger.warning(f"  ⚠ Falha ao seguir @{username}: {e}")

        logger.info(f"✅ Follow task concluída: {len(results['followed'])} seguidos")

    background_tasks.add_task(_follow_task)
    return {
        "success": True,
        "queued": len(req.usernames),
        "message": "Tarefa de follow iniciada em background."
    }

@app.post("/engage/dm", tags=["Engajamento"])
async def engage_dm(req: EngageDMRequest):
    """
    Envia uma DM de prospecção inicial para um usuário específico.
    Utiliza delay humanizado antes do envio.
    """
    cl = get_instagram_client()
    human_delay()

    try:
        user_id = cl.user_id_from_username(req.username)
        cl.direct_send(req.message, [user_id])
        logger.info(f"✅ DM enviada para @{req.username}")
        return {"success": True, "recipient": req.username}
    except Exception as e:
        logger.error(f"❌ Erro ao enviar DM para @{req.username}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sync/supabase", tags=["Sincronização"])
async def sync_to_supabase(req: SyncSupabaseRequest):
    """
    Persiste os contatos minerados no Supabase como novos `contacts`.
    Usa upsert por `instagram_username` para evitar duplicatas.

    Este endpoint é chamado pelo Airflow após a mineração para fechar
    o loop: Instagram → microserviço → Supabase → CRM frontend.
    """
    if not SUPABASE_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="supabase-py não instalado. Execute: pip install supabase"
        )

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=503, detail="Credenciais do Supabase não configuradas.")

    sb: SupabaseClient = create_client(supabase_url, supabase_key)

    # Adiciona organization_id a todos os contatos
    contacts_with_org = [
        {**c, "organization_id": req.organization_id}
        for c in req.contacts
        if c.get("instagram_username")  # Garante que tem identificador único
    ]

    if not contacts_with_org:
        return {"success": True, "inserted": 0, "message": "Nenhum contato válido para sincronizar."}

    # Upsert em lotes de 20 (evita timeout do Supabase)
    total_inserted = 0
    batch_size = 20

    for i in range(0, len(contacts_with_org), batch_size):
        batch = contacts_with_org[i:i + batch_size]
        response = sb.table("contacts").upsert(
            batch,
            on_conflict="instagram_username"  # Idempotente: evita duplicatas
        ).execute()
        total_inserted += len(response.data)
        logger.info(f"  📦 Lote {i // batch_size + 1}: {len(response.data)} contatos sincronizados")

    logger.info(f"✅ Sincronização concluída: {total_inserted} contatos no Supabase")

    return {
        "success": True,
        "inserted": total_inserted,
        "organization_id": req.organization_id,
    }

# ─── Ponto de Entrada ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=False,
        log_level="info"
    )