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
    'campanha_whatsapp_v2_1',
    default_args=default_args,
    description='Campanhas outbound personalizadas com IA',
    schedule_interval='0 9 * * 1-5',
    catchup=False,
)

def selecionar_contatos():
    # Simular query no Supabase para leads qualificados mas não convertidos
    return [
        {"phone": "5511999999999", "name": "Carlos Lima", "interesse": "Consultoria Premium"},
        {"phone": "5511988888888", "name": "Juliana Silva", "interesse": "Automação CRM"},
    ]

def gerar_mensagem_personalizada(contato):
    prompt = f"""
    Crie uma mensagem de follow-up para {contato['name']}.
    Ela demonstrou interesse em {contato['interesse']}.
    O tom deve ser profissional mas persuasivo.
    Destaque um benefício único do SOARES HUB CRM.
    Máximo 250 caracteres.
    """
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "https://soareshub.com",
        "X-Title": "SOARES HUB CRM"
    }
    
    payload = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7
    }
    
    try:
        resp = requests.post(OPENROUTER_URL, json=payload, headers=headers)
        return resp.json()['choices'][0]['message']['content']
    except:
        return f"Olá {contato['name']}, temos uma novidade sobre {contato['interesse']}! Vamos conversar?"

def enviar_mensagem(**kwargs):
    ti = kwargs['ti']
    contatos = ti.xcom_pull(task_id='selecionar_contatos')
    
    for contato in contatos:
        mensagem = gerar_mensagem_personalizada(contato)
        # Enviar via Evolution API
        print(f"Enviando para {contato['name']}: {mensagem}")
        # requests.post("http://localhost:8080/message/sendText", json={"number": contato["phone"], "text": mensagem})

selecionar_task = PythonOperator(
    task_id='selecionar_contatos',
    python_callable=selecionar_contatos,
    dag=dag,
)

processar_campanha_task = PythonOperator(
    task_id='processar_campanha',
    python_callable=enviar_mensagem,
    dag=dag,
)

selecionar_task >> processar_campanha_task