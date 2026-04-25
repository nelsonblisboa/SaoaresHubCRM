from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from airflow.providers.http.operators.http import SimpleHttpOperator
import requests

default_args = {
    'owner': 'soares-hub',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'mineracao_instagram',
    default_args=default_args,
    description='Mineração de leads no Instagram',
    schedule_interval='@daily',
    catchup=False,
)

def minerar_leads():
    # Chamar microserviço Python
    response = requests.post("http://localhost:8000/prospect", json={"target": "concorrente_x", "limit": 50})
    data = response.json()
    print(f"Mineração concluída: {data['prospected']} leads encontrados")
    return data

prospect_task = PythonOperator(
    task_id='prospect_accounts',
    python_callable=minerar_leads,
    dag=dag,
)

filter_task = PythonOperator(
    task_id='filter_and_store',
    python_callable=lambda: print("Filtrando e armazenando leads"),
    dag=dag,
)

engage_task = PythonOperator(
    task_id='follow_and_engage',
    python_callable=lambda: print("Seguindo e engajando"),
    dag=dag,
)

prospect_task >> filter_task >> engage_task