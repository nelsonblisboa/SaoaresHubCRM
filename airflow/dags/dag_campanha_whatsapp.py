"""
SOARES HUB CRM - DAG de Campanhas WhatsApp (v2.0)
Dispara campanhas outbound personalizadas com IA via OpenRouter
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.http.operators.http import SimpleHttpOperator
from airflow.hooks.http import HttpHook
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
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'campanha_whatsapp_v2_1',
    default_args=default_args,
    description='Campanhas outbound personalizadas com IA',
    schedule_interval='0 9 * * 1-5',  # Seg-Sex às 9h
    catchup=False,
    tags=['whatsapp', 'campaigns', 'outbound'],
)

def selecionar_contatos(**context):
    """
    Seleciona leads qualificados mas não convertidos.
    Busca no Supabase via API ou diretamente.
    """
    from supabase import create_client
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Supabase credentials not configured")
    
    supabase = create_client(supabase_url, supabase_key)
    
    # Buscar leads no estágio NOVO/QUALIFICADO com temperatura MORNO/QUENTE
    response = supabase.table("leads").select(
        "id, stage, temperature, score, contact:contacts(phone_number, name)"
    ).in_("stage", ["NOVO", "QUALIFICADO"]).in_(
        "temperature", ["MORNO", "QUENTE"]
    ).lt("score", 8).limit(100).execute()
    
    contatos = []
    if response.data:
        for lead in response.data:
            if lead.get("contact") and lead["contact"].get("phone_number"):
                contatos.append({
                    "lead_id": lead["id"],
                    "phone": lead["contact"]["phone_number"],
                    "name": lead["contact"]["name"] or "Lead",
                    "temperature": lead["temperature"],
                    "score": lead["score"],
                })
    
    logger.info(f"📊 Selecionados {len(contatos)} contatos para campanha")
    context['ti'].xcom_push(key='contatos_selecionados', value=contatos)
    return contatos


def gerar_mensagem_personalizada(contato, openrouter_key):
    """
    Gera mensagem personalizada via OpenRouter AI.
    """
    OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
    
    prompt = f"""
    Crie uma mensagem de follow-up para {contato['name']}.
    Temperatura do lead: {contato['temperature']} (score: {contato['score']}/10).
    
    A mensagem deve:
    - Ser profissional mas persuasiva
    - Ter máximo 250 caracteres
    - Destacar benefícios únicos do SOARES HUB CRM
    - Incluir call-to-action claro
    
    Retorne apenas a mensagem, sem aspas.
    """
    
    headers = {
        "Authorization": f"Bearer {openrouter_key}",
        "HTTP-Referer": "https://soareshub.com",
        "X-Title": "SOARES HUB CRM",
    }
    
    payload = {
        "model": "google/gemini-2.0-flash-001",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 150,
    }
    
    try:
        resp = requests.post(OPENROUTER_URL, json=payload, headers=headers, timeout=30)
        if resp.status_code == 200:
            return resp.json()['choices'][0]['message']['content'].strip()
        else:
            logger.error(f"Erro OpenRouter: {resp.status_code} - {resp.text}")
            return f"Olá {contato['name']}, temos novidades sobre nossos imóveis! Vamos conversar?"
    except Exception as e:
        logger.error(f"Exceção OpenRouter: {e}")
        return f"Olá {contato['name']}, temos novidades! Podemos agendar uma visita?"


def processar_campanha(**context):
    """
    Processa campanha: gera mensagens e envia via Evolution API.
    """
    ti = context['ti']
    contatos = ti.xcom_pull(task_ids='selecionar_contatos', key='contatos_selecionados')
    openrouter_key = os.getenv("OPENROUTER_API_KEY", "sua-chave")
    
    if not contatos:
        logger.warning("Nenhum contato selecionado para campanha")
        return {"status": "no_contacts", "sent": 0}
    
    evolution_url = os.getenv("EVOLUTION_API_URL", "http://evolution-api:8080")
    evolution_key = os.getenv("EVOLUTION_API_KEY", "")
    evolution_instance = os.getenv("EVOLUTION_INSTANCE", "default")
    
    sent = 0
    failed = 0
    
    for contato in contatos:
        try:
            # Gerar mensagem personalizada
            mensagem = gerar_mensagem_personalizada(contato, openrouter_key)
            
            # Enviar via Evolution API
            response = requests.post(
                f"{evolution_url}/message/sendText/{evolution_instance}",
                json={
                    "number": contato["phone"],
                    "text": mensagem,
                },
                headers={"apikey": evolution_key},
                timeout=10,
            )
            
            if response.status_code in [200, 201]:
                sent += 1
                logger.info(f"✅ Mensagem enviada para {contato['name']} ({contato['phone']})")
            else:
                failed += 1
                logger.error(f"❌ Falha ao enviar para {contato['phone']}: {response.text}")
            
            # Rate limiting: 1 mensagem por segundo
            import time
            time.sleep(1)
            
        except Exception as e:
            failed += 1
            logger.error(f"Exceção ao processar {contato['phone']}: {e}")
    
    logger.info(f"📤 Campanha concluída: {sent} enviadas, {failed} falhas")
    
    # Salvar estatísticas no Supabase
    try:
        from supabase import create_client
        supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )
        
        # Atualizar campanha (assumindo que existe uma campanha com nome "Campanha Automática")
        supabase.table("campanhas").update({
            "total_sent": sent,
            "total_delivered": sent,  # Assumindo que enviado = entregue
            "status": "CONCLUIDA",
        }).eq("name", "Campanha Automática").execute()
        
    except Exception as e:
        logger.error(f"Erro ao salvar estatísticas: {e}")
    
    return {"sent": sent, "failed": failed, "total": len(contatos)}


# Tasks
selecionar_task = PythonOperator(
    task_id='selecionar_contatos',
    python_callable=selecionar_contatos,
    dag=dag,
)

processar_task = PythonOperator(
    task_id='processar_campanha',
    python_callable=processar_campanha,
    dag=dag,
)

selecionar_task >> processar_task
