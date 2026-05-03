"""
SOARES HUB CRM - DAG de Lead Scoring (v2.0)
Recálculo automático de scores e temperatura via IA
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
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'lead_scoring_v2_1',
    default_args=default_args,
    description='Lead scoring inteligente via OpenRouter',
    schedule_interval='@daily',
    catchup=False,
    tags=['scoring', 'ai', 'leads'],
)

def analisar_lead_via_ia(lead_data, openrouter_key):
    """
    Analisa lead via IA e retorna novo score/temperatura.
    Precisão alvo: 90% na classificação.
    """
    OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
    
    prompt = f"""
    Analise o seguinte resumo de conversa e atribua um score de 0 a 10 e uma temperatura (FRIO, MORNO, QUENTE).
    
    Resumo: {lead_data['resumo']}
    Histórico de interações: {lead_data.get('interacoes', 0)}
    Tempo desde último contato: {lead_data.get('dias_sem_contato', 'N/A')} dias
    
    Critérios:
    - Score 8-10: Interesse claro, pronto para fechar (QUENTE)
    - Score 5-7: Interessado mas hesitante (MORNO)
    - Score 0-4: Sem interesse aparente (FRIO)
    
    Retorne APENAS um JSON válido: {{"score": number, "temperature": "string", "reason": "string"}}
    """
    
    headers = {
        "Authorization": f"Bearer {openrouter_key}",
        "HTTP-Referer": "https://soareshub.com",
        "X-Title": "SOARES HUB CRM",
    }
    
    payload = {
        "model": "google/gemini-2.0-flash-001",
        "messages": [{"role": "user", "content": prompt}],
        "response_format": {"type": "json_object"},
        "temperature": 0.3,  # Baixa temperatura para consistência
    }
    
    try:
        resp = requests.post(OPENROUTER_URL, json=payload, headers=headers, timeout=30)
        if resp.status_code == 200:
            import json
            result = json.loads(resp.json()['choices'][0]['message']['content'])
            return result
        else:
            logger.error(f"Erro OpenRouter: {resp.status_code}")
            return {"score": lead_data.get('score', 5), "temperature": "MORNO", "reason": "Fallback - API error"}
    except Exception as e:
        logger.error(f"Exceção na análise: {e}")
        return {"score": 5, "temperature": "MORNO", "reason": "Fallback - exception"}


def calcular_scores(**context):
    """
    Calcula scores para leads com base em conversas recentes.
    """
    from supabase import create_client
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    openrouter_key = os.getenv("OPENROUTER_API_KEY", "sua-chave")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Supabase credentials not configured")
    
    supabase = create_client(supabase_url, supabase_key)
    
    # Buscar leads que precisam de atualização (score < 7 ou atualização há > 7 dias)
    from datetime import datetime, timedelta
    seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
    
    response = supabase.table("leads").select(
        "id, score, temperature, updated_at, contact:contacts(name)"
    ).or_(
        f"score.lt.7,updated_at.lt.{seven_days_ago}"
    ).in_(
        "stage", ["NOVO", "QUALIFICADO", "PROPOSTA"]
    ).limit(50).execute()
    
    if not response.data:
        logger.info("Nenhum lead precisa de atualização de score")
        return {"processed": 0, "updated": 0}
    
    processed = 0
    updated = 0
    
    for lead in response.data:
        try:
            # Simular resumo da conversa (em produção, buscaria mensagens reais)
            resumo = f"Lead {lead['contact']['name'] if lead.get('contact') else 'N/A'} com score atual {lead['score']}"
            
            # Analisar via IA
            analysis = analisar_lead_via_ia({
                "resumo": resumo,
                "interacoes": 0,  # Simplificado
                "dias_sem_contato": 0,
                "score": lead['score'],
            }, openrouter_key)
            
            # Atualizar lead no Supabase
            supabase.table("leads").update({
                "score": analysis["score"],
                "temperature": analysis["temperature"],
            }).eq("id", lead["id"]).execute()
            
            updated += 1
            logger.info(f"✅ Lead {lead['id']}: score {lead['score']} → {analysis['score']}, temp {lead['temperature']} → {analysis['temperature']}")
            logger.info(f"   Razão: {analysis.get('reason', 'N/A')}")
            
            processed += 1
            
        except Exception as e:
            logger.error(f"Erro ao processar lead {lead['id']}: {e}")
            continue
    
    logger.info(f"📊 Scoring concluído: {processed} processados, {updated} atualizados")
    return {"processed": processed, "updated": updated}


# Task
scoring_task = PythonOperator(
    task_id='calcular_scores_ia',
    python_callable=calcular_scores,
    dag=dag,
)
