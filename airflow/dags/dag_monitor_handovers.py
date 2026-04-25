from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python_operator import PythonOperator

default_args = {
    'owner': 'soares-hub',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
)

dag = DAG(
    'monitor_handovers',
    default_args=default_args,
    description='Monitoramento de handovers',
    schedule_interval='*/10 * * * *',
    catchup=False,
)

def detectar_handovers():
    # Simular detecção
    handovers = [{"id": 1, "status": "PENDENTE", "time": 20}]
    print(f"Handovers detectados: {handovers}")
    return handovers

monitor_task = PythonOperator(
    task_id='detectar_handovers',
    python_callable=detectar_handovers,
    dag=dag,
)