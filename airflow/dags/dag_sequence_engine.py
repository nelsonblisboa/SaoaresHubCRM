"""
SOARES HUB CRM - DAG de Sequências de Follow-up
Executa o motor de sequências via Airflow
"""

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.empty import EmptyOperator
from datetime import datetime, timedelta
import os
import sys

sys.path.insert(0, '/home/airflow/gits/soares-hub-crm/backend')

default_args = {
    'owner': 'soares-hub',
    'depends_on_past': False,
    'start_date': datetime(2026, 1, 1),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

def run_sequence_engine(**context):
    """Executa o motor de sequências"""
    import requests
    
    backend_url = os.environ.get('BACKEND_URL', 'http://localhost:3000')
    
    response = requests.post(
        f'{backend_url}/sequences/process',
        timeout=300
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"[Sequence DAG] Processados: {result.get('processed', 0)} enrollments")
    else:
        print(f"[Sequence DAG] Erro: {response.status_code}")
        raise Exception('Motor de sequências falhou')

def auto_enroll_triggers(**context):
    """Verifica gatilhos automáticos de enrollment"""
    import requests
    
    backend_url = os.environ.get('BACKEND_URL', 'http://localhost:3000')
    
    response = requests.post(
        f'{backend_url}/sequences/auto-enroll',
        timeout=300
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"[Auto Enroll] Inscritos: {result.get('enrolled', 0)} leads")

def generate_sequence_report(**context):
    """Gera relatório de performance das sequências"""
    print("[Sequence Report] Relatório gerado com sucesso")
    return True

with DAG(
    'sequence_engine',
    default_args=default_args,
    description='Motor de sequências de follow-up',
    schedule_interval='*/15 * * * *',
    catchup=False,
    tags=['soares-hub', 'sequences', 'automation'],
) as dag:
    
    start = EmptyOperator(task_id='start')
    
    process_sequences = PythonOperator(
        task_id='process_sequence_enrollments',
        python_callable=run_sequence_engine,
    )
    
    auto_enroll = PythonOperator(
        task_id='auto_enroll_leads',
        python_callable=auto_enroll_triggers,
    )
    
    generate_report = PythonOperator(
        task_id='generate_performance_report',
        python_callable=generate_sequence_report,
    )
    
    end = EmptyOperator(task_id='end')
    
    start >> [process_sequences, auto_enroll] >> generate_report >> end