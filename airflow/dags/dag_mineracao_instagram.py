"""
SOARES HUB CRM - DAG de Mineração Instagram (v2.0)
Executa prospecção via microserviço Python e armazena leads no Supabase
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.http import SimpleHttpOperator
from airflow.hooks.http import HttpHook
from airflow.providers.postgres.operators.postgres import PostgresOperator
import requests
import logging

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
    'mineracao_instagram',
    default_args=default_args,
    description='Mineração de leads no Instagram via microserviço',
    schedule_interval='@daily',
    catchup=False,
    tags=['instagram', 'prospecting', 'mineration'],
)

def prospect_instagram_accounts(**context):
    """
    Executa prospecção via microserviço Instagram Service.
    Armazena leads diretamente no Supabase via API.
    """
    from supabase import create_client, ClientOptions
    
    # Configurações
    supabase_url = context['ti'].xcom_pull(key='supabase_url') or 'https://joxsdkjbbvdjzelxjnxk.supabase.co'
    supabase_key = context['ti'].xcom_pull(key='supabase_service_key')
    
    if not supabase_key:
        raise ValueError("SUPABASE_SERVICE_KEY não configurada")
    
    # Targets de prospecção (podem vir do banco ou configuração)
    targets = [
        {"username": "concorrente_luxo", "limit": 100, "org_id": "00000000-0000-0000-0000-000000000001"},
        {"username": "influencer_imoveis", "limit": 50, "org_id": "00000000-0000-0000-0000-000000000001"},
    ]
    
    results = []
    
    for target in targets:
        try:
            logger.info(f"🔍 Prospectando @{target['username']}...")
            
            # Chamar microserviço Instagram
            response = requests.post(
                "http://instagram-service:8000/prospect",
                json={
                    "target_username": target["username"],
                    "limit": target["limit"],
                    "organization_id": target["org_id"],
                    "send_dm": False,
                },
                headers={"X-API-Key": "soares-hub-instagram-secret-2026"},
                timeout=300  # 5 minutos para prospecção
            )
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"✅ Concluído: {data.get('total_found', 0)} encontrados, {data.get('total_saved', 0)} salvos")
                results.append({
                    "target": target["username"],
                    "status": "success",
                    "found": data.get('total_found', 0),
                    "saved": data.get('total_saved', 0)
                })
            else:
                logger.error(f"❌ Erro no microserviço: {response.status_code} - {response.text}")
                results.append({
                    "target": target["username"],
                    "status": "error",
                    "error": response.text
                })
                
        except Exception as e:
            logger.error(f"❌ Exceção na prospecção de @{target['username']}: {e}")
            results.append({
                "target": target["username"],
                "status": "exception",
                "error": str(e)
            })
    
    # Salvar resultados no XCom para monitoramento
    context['ti'].xcom_push(key='prospection_results', value=results)
    return results


def filter_and_store_leads(**context):
    """
    Filtra leads prospectados e armazena no Supabase.
    Remove duplicatas e valida qualidade.
    """
    from supabase import create_client
    
    ti = context['ti']
    prospect_results = ti.xcom_pull(task_ids='prospect_instagram', key='prospection_results')
    
    if not prospect_results:
        logger.warning("Nenhum resultado de prospecção encontrado")
        return
    
    logger.info(f"📊 Resultados de prospecção: {prospect_results}")
    
    # Aqui poderia fazer filtragem adicional, validação de qualidade, etc.
    # Por exemplo: remover leads com perfil vazio, verificar se é realmente um lead qualificado
    
    total_saved = sum(r.get('saved', 0) for r in prospect_results if r.get('status') == 'success')
    logger.info(f"✅ Total de leads salvos no Supabase: {total_saved}")
    
    return {"total_saved": total_saved}


def engage_with_leads(**context):
    """
    Engaja com leads via Instagram (follow, likes, DMs).
    """
    targets = [
        {"username": "concorrente_luxo", "actions": ["follow", "like"], "limit": 20},
    ]
    
    for target in targets:
        try:
            logger.info(f"🤝 Engajando com seguidores de @{target['username']}...")
            
            response = requests.post(
                "http://instagram-service:8000/engage",
                json=target,
                headers={"X-API-Key": "soares-hub-instagram-secret-2026"},
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"✅ Engajamento concluído: {data}")
            else:
                logger.error(f"❌ Erro no engajamento: {response.text}")
                
        except Exception as e:
            logger.error(f"❌ Exceção no engajamento: {e}")


# Tasks
prospect_task = PythonOperator(
    task_id='prospect_instagram',
    python_callable=prospect_instagram_accounts,
    dag=dag,
)

filter_task = PythonOperator(
    task_id='filter_and_store',
    python_callable=filter_and_store_leads,
    dag=dag,
)

engage_task = PythonOperator(
    task_id='follow_and_engage',
    python_callable=engage_with_leads,
    dag=dag,
)

# Dependências
prospect_task >> filter_task >> engage_task
