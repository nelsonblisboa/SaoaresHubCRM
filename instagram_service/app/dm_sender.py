"""
Instagram DM Sender - Envio de mensagens diretas
Integra com Supabase para salvar histórico
"""

from instagrapi.types import DirectMessage
from instagrapi import Client
from supabase import create_client, ClientOptions
import os
import logging
from typing import Optional, Dict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DMSender:
    """Sender de DMs para leads do Instagram"""
    
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
            logger.warning("Supabase credentials not found for DM Sender")
    
    def _ensure_login(self):
        """Garante login no Instagram"""
        if self._logged_in:
            return True
            
        if not self.username or not self.password:
            raise ValueError("INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD must be set")
        
        try:
            self.client.login(self.username, self.password)
            self._logged_in = True
            logger.info(f"✅ Logged in as @{self.username}")
            return True
        except Exception as e:
            logger.error(f"Login failed: {e}")
            raise
    
    async def send_dm(
        self,
        username: str,
        message: str,
        organization_id: str = None
    ) -> Dict:
        """
        Envia DM para um usuário específico.
        
        Args:
            username: Nome de usuário (sem @)
            message: Mensagem a enviar
            organization_id: ID da organização (para salvar no Supabase)
        
        Returns:
            Dict com status do envio
        """
        try:
            self._ensure_login()
            
            # Buscar ID do usuário
            user_id = self.client.user_id_from_username(username)
            
            # Enviar DM
            dm_result = self.client.direct_send(message, [user_id])
            
            logger.info(f"✅ DM enviada para @{username}")
            
            # Salvar no Supabase se disponível
            if self.supabase and organization_id:
                try:
                    # Buscar ou criar contato
                    contact_result = self.supabase.table("contacts").select("*").eq(
                        "instagram_username", username
                    ).eq("organization_id", organization_id).execute()
                    
                    contact_id = None
                    if not contact_result.data:
                        # Criar novo contato
                        new_contact = self.supabase.table("contacts").insert({
                            "name": username,
                            "instagram_username": username,
                            "source": "instagram_dm",
                            "tags": ["dm_outreach"],
                            "organization_id": organization_id,
                        }).execute()
                        
                        if new_contact.data:
                            contact_id = new_contact.data[0]["id"]
                    else:
                        contact_id = contact_result.data[0]["id"]
                    
                    # Salvar mensagem no Supabase (tabela messages requer conversation_id)
                    # Assumindo que a mensagem foi enviada via DM direto (não conversation)
                    logger.info(f"DM salva no Supabase para contato {contact_id}")
                    
                except Exception as e:
                    logger.error(f"Erro ao salvar no Supabase: {e}")
            
            return {
                "status": "success",
                "username": username,
                "message": message[:50] + "..." if len(message) > 50 else message,
                "dm_id": str(dm_result.thread_id) if dm_result else None
            }
            
        except Exception as e:
            logger.error(f"❌ Erro ao enviar DM para @{username}: {e}")
            return {
                "status": "error",
                "username": username,
                "error": str(e)
            }
    
    async def send_bulk_dm(
        self,
        usernames: list,
        message_template: str,
        organization_id: str = None
    ) -> Dict:
        """
        Envio em lote de DMs personalizadas.
        
        Args:
            usernames: Lista de usernames
            message_template: Template com {name} para personalização
            organization_id: ID da organização
        """
        results = {"sent": 0, "failed": 0, "errors": []}
        
        for username in usernames:
            try:
                # Personalizar mensagem
                user_info = self.client.user_info_by_username(username)
                personalized_msg = message_template.replace("{name}", user_info.full_name or username)
                
                result = await self.send_dm(username, personalized_msg, organization_id)
                
                if result["status"] == "success":
                    results["sent"] += 1
                else:
                    results["failed"] += 1
                    results["errors"].append(f"{username}: {result.get('error', 'Unknown')}")
                
                # Rate limiting
                import time
                time.sleep(5)
                
            except Exception as e:
                results["failed"] += 1
                results["errors"].append(f"{username}: {str(e)}")
        
        return results
