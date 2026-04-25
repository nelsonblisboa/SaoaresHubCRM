from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
import requests
import os

# Configurações do OpenRouter
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "sua-chave")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemini-2.0-flash-001"

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
    'lead_scoring_v2_1',
    default_args=default_args,
    description='Lead scoring inteligente via OpenRouter',
    schedule_interval='@daily',
    catchup=False,
)

def analisar_lead(lead_data):
    prompt = f"""
    Analise o seguinte resumo de conversa e atribua um score de 0 a 10 e uma temperatura (FRIO, MORNO, QUENTE).
    Resumo: {lead_data['resumo']}
    
    Retorne apenas um JSON: {{"score": number, "temperature": "string"}}
    """
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "https://soareshub.com",
        "X-Title": "SOARES HUB CRM"
    }
    
    payload = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "response_format": { "type": "json_object" }
    }
    
    try:
        resp = requests.post(OPENROUTER_URL, json=payload, headers=headers)
        return resp.json()['choices'][0]['message']['content']
    except:
        return '{"score": 5, "temperature": "MORNO"}'

def calcular_scores():
    # Simular consulta ao Supabase por conversas recentes
    leads_para_analisar = [
        {"id": 1, "resumo": "Cliente perguntou preço e formas de pagamento."},
        {"id": 2, "resumo": "Cliente disse que vai pensar e retornar no mês que vem."},
    ]
    
    for lead in leads_para_analisar:
        resultado = analisar_lead(lead)
        print(f"Lead {lead['id']} análise: {resultado}")
        # Aqui salvaria no Supabase

scoring_task = PythonOperator(
    task_id='calcular_scores_ia',
    python_callable=calcular_scores,
    dag=dag,
)