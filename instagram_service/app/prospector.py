"""
Instagram Prospector - Mineração e extração de leads
Usa instagrapi para extrair seguidores e gerar leads no Supabase
"""

from instagrapi import Client
from instagrapi.exceptions import LoginRequired, ChallengeRequired
from supabase import create_client, ClientOptions
import os
import logging
from typing import List, Dict, Optional
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class InstagramProspector:
    """Prospector Instagram usando instagrapi"""
    
    def __init__(self):
        self.client = Client()
        self.username = os.getenv("INSTAGRAM_USERNAME")
        self.password = os.getenv("INSTAGRAM_PASSWORD")
        self._logged_in = False
        
        # Supabase setup
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        if supabase_url and supabase_key:
            self.supabase = create_client(supabase_url, supabase_key, options=ClientOptions(schema="public"))
        else:
            self.supabase = None
            logger.warning("Supabase credentials not found")
    
    def _ensure_login(self):
        """Garante que está logado no Instagram"""
        if self._logged_in:
            return True
            
        if not self.username or not self.password:
            raise ValueError("INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD must be set")
        
        try:
            self.client.login(self.username, self.password)
            self._logged_in = True
            logger.info(f"✅ Logged in as @{self.username}")
            return True
        except ChallengeRequired as e:
            logger.error(f"Challenge required: {e}")
            raise Exception("Instagram challenge required - manual intervention needed")
        except Exception as e:
            logger.error(f"Login failed: {e}")
            raise
    
    async def prospect(
        self,
        target_username: str,
        limit: int = 50,
        organization_id: str = None,
        send_dm: bool = False,
        dm_template: Optional[str] = None
    ) -> Dict:
        """
        Mineração de seguidores de um perfil alvo.
        
        Args:
            target_username: Usuário alvo (sem @)
            limit: Máximo de seguidores para extrair
            organization_id: ID da organização (para salvar no Supabase)
            send_dm: Se deve enviar DM automática
            dm_template: Template da DM (use {name} para o nome)
        
        Returns:
            Dict com status e leads extraídos
        """
        errors = []
        leads_saved = 0
        followers_data = []
        
        try:
            self._ensure_login()
            
            # 1. Buscar informações do alvo
            logger.info(f"🔍 Buscando @{target_username}...")
            target_user = self.client.user_info_by_username(target_username)
            logger.info(f"✅ Alvo: {target_user.full_name} (@{target_user.username}) - {target_user.follower_count} seguidores")
            
            # 2. Extrair seguidores
            logger.info(f"📥 Extraindo até {limit} seguidores...")
            followers = []
            
            for follower in self.client.user_followers(target_user.pk, amount=limit):
                try:
                    user_info = self.client.user_info(follower)
                    followers_data.append({
                        "username": user_info.username,
                        "full_name": user_info.full_name,
                        "profile_pic": str(user_info.profile_pic_url),
                        "follower_count": user_info.follower_count,
                        "following_count": user_info.following_count,
                        "biography": user_info.biography[:500] if user_info.biography else "",
                        "is_private": user_info.is_private,
                    })
                    
                    if len(followers_data) % 10 == 0:
                        logger.info(f"  Extraídos: {len(followers_data)}/{limit}")
                    
                    # Rate limiting básico
                    time.sleep(1)
                    
                except Exception as e:
                    errors.append(f"Erro ao extrair {follower}: {str(e)}")
                    continue
            
            logger.info(f"✅ Extração concluída: {len(followers_data)} seguidores")
            
            # 3. Salvar no Supabase
            if self.supabase and organization_id:
                leads_saved = await self._save_leads_to_supabase(
                    followers_data, 
                    organization_id,
                    send_dm,
                    dm_template
                )
            
            return {
                "status": "success",
                "total_found": len(followers_data),
                "total_saved": leads_saved,
                "leads": followers_data[:10],  # Retorna apenas primeiros 10
                "errors": errors
            }
            
        except Exception as e:
            logger.error(f"❌ Erro na prospecção: {e}")
            return {
                "status": "error",
                "message": str(e),
                "total_found": 0,
                "total_saved": 0,
                "leads": [],
                "errors": [str(e)]
            }
    
    async def _save_leads_to_supabase(
        self, 
        followers: List[Dict],
        organization_id: str,
        send_dm: bool = False,
        dm_template: Optional[str] = None
    ) -> int:
        """Salva leads no Supabase (tabela contacts)"""
        saved = 0
        
        for follower in followers:
            try:
                # Verificar se já existe
                existing = self.supabase.table("contacts").select("id").eq(
                    "instagram_username", follower["username"]
                ).eq("organization_id", organization_id).execute()
                
                if existing.data:
                    logger.debug(f"  Já existe: @{follower['username']}")
                    continue
                
                # Criar novo contato
                contact_data = {
                    "name": follower["full_name"] or follower["username"],
                    "instagram_username": follower["username"],
                    "source": "instagram",
                    "tags": ["prospecting", "auto-capture"],
                    "organization_id": organization_id,
                }
                
                result = self.supabase.table("contacts").insert(contact_data).execute()
                
                if result.data:
                    saved += 1
                    logger.info(f"  ✅ Lead salvo: {follower['full_name']} (@{follower['username']})")
                    
                    # Criar lead automaticamente
                    if result.data[0].get("id"):
                        self.supabase.table("leads").insert({
                            "stage": "NOVO",
                            "score": 1,
                            "temperature": "FRIO",
                            "contact_id": result.data[0]["id"],
                            "organization_id": organization_id,
                        }).execute()
                
            except Exception as e:
                logger.error(f"Erro ao salvar @{follower['username']}: {e}")
                continue
        
        logger.info(f"✅ Total salvo no Supabase: {saved} leads")
        return saved
    
    async def engage(
        self,
        target_username: str,
        actions: List[str] = ["follow", "like"],
        limit: int = 20
    ) -> Dict:
        """
        Automação de engajamento: follow, likes, comments.
        """
        results = {"followed": 0, "liked": 0, "commented": 0, "errors": []}
        
        try:
            self._ensure_login()
            
            target_user = self.client.user_info_by_username(target_username)
            followers = list(self.client.user_followers(target_user.pk, amount=limit))
            
            for follower_pk in followers:
                try:
                    user_info = self.client.user_info(follower_pk)
                    username = user_info.username
                    
                    # Follow
                    if "follow" in actions:
                        try:
                            self.client.user_follow(follower_pk)
                            results["followed"] += 1
                            logger.info(f"  ✅ Followed @{username}")
                            time.sleep(2)
                        except Exception as e:
                            results["errors"].append(f"Follow @{username}: {str(e)}")
                    
                    # Like recent posts
                    if "like" in actions:
                        try:
                            medias = self.client.user_medias(follower_pk, amount=3)
                            for media in medias:
                                self.client.media_like(media.id)
                                results["liked"] += 1
                                time.sleep(1)
                        except Exception as e:
                            results["errors"].append(f"Like @{username}: {str(e)}")
                    
                except Exception as e:
                    results["errors"].append(f"Process {follower_pk}: {str(e)}")
                    continue
            
            return results
            
        except Exception as e:
            logger.error(f"Engagement error: {e}")
            results["errors"].append(str(e))
            return results
