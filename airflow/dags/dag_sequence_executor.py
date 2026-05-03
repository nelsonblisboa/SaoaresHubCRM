"""
SOARES HUB CRM - DAG Sequence Executor (v2.0)
Executa passos de sequências de follow-up pendentes
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
import requests
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

default_args = {
    'owner': 'soares-hub',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email_on_failure': True,
    'retries': 3,
    'retry_delay': timedelta(minutes=2),
}

dag = DAG(
    'sequence_executor_v2',
    default_args=default_args,
    description='Executa sequências de follow-up',
    schedule_interval='*/5 * * * *',  # A cada 5 minutos
    catchup=False,
    tags=['sequences', 'followup', 'automation'],
)

def executar_sequencias(**context):
    """
    Executa passos pendentes de sequências de follow-up.
    
    Fluxo:
    1. Busca enrollments com next_run_at <= agora
    2. Para cada enrollment, busca o passo atual
    3. Gera mensagem (IA ou template)
    4. Envia via Evolution API
    5. Avança para o próximo passo ou conclui
    """
    from supabase import create_client
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Supabase credentials not configured")
    
    supabase = create_client(supabase_url, supabase_key)
    now = datetime.utcnow().isoformat()
    
    # 1. Buscar enrollments prontos para execução
    enrollments = supabase.table("sequence_enrollments").select(
        "id, sequence_id, contact_id, current_step, next_run_at, status"
    ).eq("status", "ACTIVE").lte("next_run_at", now).execute()
    
    if not enrollments.data:
        logger.info("Nenhum enrollment pendente no momento")
        return {"processed": 0, "sent": 0}
    
    processed = 0
    sent = 0
    
    for enrollment in enrollments.data:
        try:
            # 2. Buscar detalhes do passo atual
            step_response = supabase.table("sequence_steps").select(
                "*"
            ).eq("sequence_id", enrollment['sequence_id']).eq(
                "order", enrollment['current_step']
            ).execute()
            
            if not step_response.data:
                logger.warning(f"Passo {enrollment['current_step']} não encontrado para seq {enrollment['sequence_id']}")
                continue
            
            step = step_response.data[0]
            
            # 3. Buscar dados do contato
            contact_response = supabase.table("contacts").select(
                "name, phone_number, instagram_username, organization_id"
            ).eq("id", enrollment['contact_id']).execute()
            
            if not contact_response.data:
                logger.error(f"Contato {enrollment['contact_id']} não encontrado")
                continue
            
            contact = contact_response.data[0]
            contact_name = contact.get("name") or "Lead"
            
            # 4. Gerar mensagem
            message = None
            if step.get("use_ai") and step.get("ai_prompt"):
                # Gerar via OpenRouter
                OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
                OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")
                
                prompt = f"""
                {step['ai_prompt']}
                
                Contexto:
                - Nome do lead: {contact_name}
                - Canal: {step['channel']}
                - Sequência de follow-up
                
                Máximo 250 caracteres. Tom natural e humano.
                """
                
                try:
                    resp = requests.post(
                        OPENROUTER_URL,
                        json={
                            "model": "google/gemini-2.0-flash-001",
                            "messages": [{"role": "user", "content": prompt}],
                            "temperature": 0.7,
                            "max_tokens": 150,
                        },
                        headers={
                            "Authorization": f"Bearer {OPENROUTER_KEY}",
                            "HTTP-Referer": "https://soareshub.com",
                        },
                        timeout=30
                    )
                    
                    if resp.status_code == 200:
                        message = resp.json()['choices'][0]['message']['content'].strip()
                except Exception as e:
                    logger.error(f"Erro IA: {e}")
            
            # Fallback para template
            if not message and step.get("message_template"):
                message = step["message_template"].replace("{{nome}}", contact_name)
            
            if not message:
                logger.warning(f"Sem mensagem para enrollment {enrollment['id']}")
                continue
            
            # 5. Enviar mensagem via canal apropriado
            channel = step.get("channel", "WHATSAPP")
            sent_success = False
            
            if channel == "WHATSAPP" and contact.get("phone_number"):
                evolution_url = os.getenv("EVOLUTION_API_URL", "http://evolution-api:8080")
                evolution_key = os.getenv("EVOLUTION_API_KEY", "")
                
                try:
                    resp = requests.post(
                        f"{evolution_url}/message/sendText/default",
                        json={
                            "number": contact["phone_number"],
                            "text": message,
                        },
                        headers={"apikey": evolution_key},
                        timeout=10
                    )
                    
                    if resp.status_code in [200, 201]:
                        sent_success = True
                        sent += 1
                        logger.info(f"✅ Mensagem enviada para {contact_name} via WhatsApp")
                except Exception as e:
                    logger.error(f"Erro ao enviar WhatsApp: {e}")
            
            elif channel == "INSTAGRAM" and contact.get("instagram_username"):
                # Enviar via Instagram Service
                instagram_url = os.getenv("INSTAGRAM_SERVICE_URL", "http://instagram-service:8000")
                
                try:
                    resp = requests.post(
                        f"{instagram_url}/dm/send",
                        json={
                            "username": contact["instagram_username"],
                            "message": message,
                            "organization_id": contact.get("organization_id"),
                        },
                        headers={"X-API-Key": os.getenv("INSTAGRAM_SERVICE_KEY")},
                        timeout=30
                    )
                    
                    if resp.status_code == 200:
                        sent_success = True
                        sent += 1
                        logger.info(f"✅ DM enviada para @{contact['instagram_username']}")
                except Exception as e:
                    logger.error(f"Erro ao enviar Instagram DM: {e}")
            
            # 6. Avançar para próximo passo ou concluir
            if sent_success:
                # Buscar próximo passo
                next_step_response = supabase.table("sequence_steps").select(
                    "order"
                ).eq("sequence_id", enrollment['sequence_id']).gt(
                    "order", enrollment['current_step']
                ).order("order").limit(1).execute()
                
                if next_step_response.data:
                    # Avançar para próximo passo
                    next_step_order = next_step_response.data[0]['order']
                    next_step_delay = step.get("delay_minutes", 1440)  # Default: 1 dia
                    next_run = (datetime.utcnow() + timedelta(minutes=next_step_delay)).isoformat()
                    
                    supabase.table("sequence_enrollments").update({
                        "current_step": next_step_order,
                        "next_run_at": next_run,
                    }).eq("id", enrollment['id']).execute()
                    
                    logger.info(f"  ➡️ Avançado para passo {next_step_order}, próxima execução: {next_run}")
                else:
                    # Sequência concluída
                    supabase.table("sequence_enrollments").update({
                        "status": "COMPLETED",
                        "completed_at": datetime.utcnow().isoformat(),
                    }).eq("id", enrollment['id']).execute()
                    
                    logger.info(f"✅ Sequência concluída para {contact_name}")
                
                processed += 1
            
        except Exception as e:
            logger.error(f"Erro ao processar enrollment {enrollment['id']}: {e}")
            continue
    
    logger.info(f"📤 Execução concluída: {processed} processados, {sent} enviados")
    
    return {"processed": processed, "sent": sent, "total": len(enrollments.data)}


# Task
executor_task = PythonOperator(
    task_id='executar_sequencias',
    python_callable=executar_sequencias,
    dag=dag,
)
