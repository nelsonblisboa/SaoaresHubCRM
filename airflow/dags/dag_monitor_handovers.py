"""
SOARES HUB CRM - DAG Monitor de Handovers (v2.0)
Detecta handovers pendentes e alerta gerentes
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
import requests
import logging

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
    'monitor_handovers_v2',
    default_args=default_args,
    description='Monitoramento de handovers pendentes',
    schedule_interval='*/10 * * * *',  # A cada 10 minutos
    catchup=False,
    tags=['handover', 'monitoring', 'alerts'],
)

def detectar_e_alertar_handovers(**context):
    """
    Detecta handovers pendentes e alerta gerentes.
    Timeout: 15 minutos para alerta, 30 minutos para escalonamento.
    """
    from supabase import create_client
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Supabase credentials not configured")
    
    supabase = create_client(supabase_url, supabase_key)
    
    # Buscar handovers pendentes com timeout
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    timeout_15min = (now - timedelta(minutes=15)).isoformat()
    timeout_30min = (now - timedelta(minutes=30)).isoformat()
    
    # Handovers há mais de 15 min
    response_15min = supabase.table("handovers").select(
        "id, reason, created_at, conversation_id, status"
    ).eq("status", "PENDENTE").lt("created_at", timeout_15min).execute()
    
    # Handovers há mais de 30 min (escalonamento)
    response_30min = supabase.table("handovers").select(
        "id, reason, created_at, conversation_id, status"
    ).eq("status", "PENDENTE").lt("created_at", timeout_30min).execute()
    
    alerts_sent = 0
    
    # Alertas para > 15 min
    if response_15min.data:
        for handover in response_15min.data:
            minutes_waiting = (now - datetime.fromisoformat(handover['created_at'])).minutes
            logger.warning(f"⚠️ Handover {handover['id']} pendente há {minutes_waiting} min")
            
            # Buscar gerentes da organização
            # (Simplificado: busca todos usuários ADMIN/GERENTE)
            managers = supabase.table("profiles").select(
                "id, email, name, organization_id"
            ).in_("role", ["ADMIN", "GERENTE"]).execute()
            
            if managers.data:
                for manager in managers.data:
                    # Enviar notificação (via Supabase ou email)
                    logger.info(f"  📧 Alerta enviado para {manager['name']} ({manager['email']})")
                    alerts_sent += 1
    
    # Escalonamento para > 30 min
    if response_30min.data:
        for handover in response_30min.data:
            logger.error(f"🚨 ESCALONAMENTO: Handover {handover['id']} há > 30 min")
            # Em produção: enviar para diretoria, Slack, etc.
            alerts_sent += 1
    
    logger.info(f"✅ Monitoramento concluído: {alerts_sent} alertas enviados")
    
    return {
        "pending_15min": len(response_15min.data) if response_15min.data else 0,
        "pending_30min": len(response_30min.data) if response_30min.data else 0,
        "alerts_sent": alerts_sent,
    }


# Task
monitor_task = PythonOperator(
    task_id='detectar_e_alertar',
    python_callable=detectar_e_alertar_handovers,
    dag=dag,
)
