# dag_aquecimento_frios.py
from airflow.decorators import dag, task
import requests
from datetime import datetime, timedelta
import os

# Configurações do OpenRouter via variáveis de ambiente ou hardcoded (conforme solicitado na doc)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "sua-chave")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemini-2.0-flash-001"

default_args = {
    'owner': 'SOARES HUB',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

@dag(
    dag_id='aquecer_leads_frios_v2_1',
    default_args=default_args,
    schedule_interval='0 10 * * 1-5', # Seg-Sex as 10:00
    start_date=datetime(2024, 1, 1),
    catchup=False,
    tags=['crm', 'ia', 'aquecimento'],
)
def aquecer_leads_frios():
    
    @task
    def selecionar_leads_frios():
        """
        Simula a consulta ao Supabase: leads FRIOS, sem interação há 5 dias.
        Em produção, usaria a biblioteca postgrest ou supabase-py.
        """
        # Exemplo de retorno
        return [
            {"id": "1", "nome": "Carlos", "interesse": "CRM Imobiliário"},
            {"id": "2", "nome": "Juliana", "interesse": "Automação de WhatsApp"},
            {"id": "3", "nome": "Roberto", "interesse": "Gestão de Leads"}
        ]

    @task
    def gerar_mensagem_aquecimento(lead):
        """
        Usa o OpenRouter para gerar conteúdo personalizado e contextual.
        """
        prompt = f"""
        Crie uma mensagem curta e amigável para um lead frio chamado {lead['nome']}.
        Ele demonstrou interesse em {lead.get('interesse', 'nossos serviços')}.
        O objetivo é reengajar de forma leve, sem pressionar para compra.
        Ofereça um conteúdo útil ou faça uma pergunta aberta.
        Importante: Use um tom humano e não de robô. Máximo 200 caracteres.
        """
        
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "HTTP-Referer": "https://soareshub.com",
            "X-Title": "SOARES HUB CRM"
        }
        
        payload = {
            "model": MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.8,
            "max_tokens": 300
        }
        
        try:
            resp = requests.post(OPENROUTER_URL, json=payload, headers=headers)
            resp.raise_for_status()
            return resp.json()['choices'][0]['message']['content']
        except Exception as e:
            print(f"Erro ao gerar mensagem para {lead['nome']}: {e}")
            return None

    @task
    def enviar_whatsapp(lead, mensagem):
        """
        Chama a Evolution API para enviar a mensagem gerada.
        """
        if not mensagem:
            return
            
        print(f"Enviando para {lead['nome']}: {mensagem}")
        # Aqui viria o POST para a Evolution API
        # requests.post(f"{EVOLUTION_URL}/message/sendText/{INSTANCE}", ...)

    leads = selecionar_leads_frios()
    
    # Processamento em paralelo para cada lead selecionado
    for lead in leads:
        msg = gerar_mensagem_aquecimento(lead)
        enviar_whatsapp(lead, msg)

dag_instance = aquecer_leads_frios()
