# dag_sequence_executor.py
# Executa passos de sequências de follow-up pendentes
from airflow.decorators import dag, task
import requests
from datetime import datetime, timedelta
import os

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "sua-chave")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemini-2.0-flash-001"
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")
EVOLUTION_URL = os.getenv("EVOLUTION_API_URL", "http://localhost:8081")
EVOLUTION_KEY = os.getenv("EVOLUTION_API_KEY", "")

default_args = {
    'owner': 'SOARES HUB',
    'depends_on_past': False,
    'email_on_failure': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=2),
}

@dag(
    dag_id='sequence_executor_v2',
    default_args=default_args,
    schedule_interval='*/5 * * * *',  # A cada 5 minutos
    start_date=datetime(2024, 1, 1),
    catchup=False,
    tags=['crm', 'sequences', 'followup'],
)
def execute_sequences():
    """
    Executa passos pendentes de sequências de follow-up.
    
    Fluxo:
    1. Busca enrollments com nextRunAt <= agora
    2. Para cada enrollment, busca o passo atual
    3. Gera mensagem (IA ou template)
    4. Envia via Evolution API
    5. Avança para o próximo passo ou conclui
    """

    @task
    def buscar_pendentes():
        """Busca enrollments prontos para execução"""
        # Em produção: query direta no Supabase
        # Por agora, simula busca
        return [
            {
                "enrollment_id": "enr-001",
                "sequence_id": "seq-001",
                "contact_id": "ct-001",
                "contact_name": "Carlos Lima",
                "contact_phone": "5511999999999",
                "current_step": 1,
                "step": {
                    "order": 1,
                    "delay_minutes": 0,
                    "use_ai": True,
                    "ai_prompt": "Envie uma mensagem amigável de reengajamento",
                    "message_template": None,
                    "channel": "WHATSAPP"
                },
                "next_step_exists": True,
                "next_step_delay": 2880  # 2 dias
            }
        ]

    @task
    def gerar_mensagem(enrollment):
        """Gera mensagem personalizada (IA ou template)"""
        step = enrollment["step"]
        
        if step["use_ai"] and step["ai_prompt"]:
            prompt = f"""
            {step['ai_prompt']}
            
            Contexto:
            - Nome do lead: {enrollment['contact_name']}
            - Canal: {step['channel']}
            - Tipo: Sequência automática de follow-up
            
            Regras:
            - Máximo 200 caracteres
            - Tom humano e natural
            - Não mencione que é automático
            """
            
            headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "HTTP-Referer": "https://soareshub.com",
                "X-Title": "SOARES HUB CRM - Sequences"
            }
            
            payload = {
                "model": MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.8,
                "max_tokens": 200
            }
            
            try:
                resp = requests.post(OPENROUTER_URL, json=payload, headers=headers, timeout=15)
                resp.raise_for_status()
                message = resp.json()['choices'][0]['message']['content']
                enrollment["generated_message"] = message.strip()
            except Exception as e:
                print(f"Erro IA para {enrollment['contact_name']}: {e}")
                enrollment["generated_message"] = None
        else:
            # Template com variáveis
            template = step.get("message_template", "")
            enrollment["generated_message"] = template.replace(
                "{{nome}}", enrollment["contact_name"]
            )
        
        return enrollment

    @task
    def enviar_mensagem(enrollment):
        """Envia via Evolution API e atualiza enrollment"""
        if not enrollment.get("generated_message"):
            print(f"Sem mensagem para {enrollment['contact_name']}, pulando")
            return
        
        phone = enrollment["contact_phone"]
        message = enrollment["generated_message"]
        
        print(f"[Sequence] Enviando para {enrollment['contact_name']}: {message}")
        
        # Enviar via Evolution API
        try:
            requests.post(
                f"{EVOLUTION_URL}/message/sendText/default",
                json={"number": phone, "text": message},
                headers={"apikey": EVOLUTION_KEY},
                timeout=10
            )
            print(f"[Sequence] ✅ Enviado para {phone}")
        except Exception as e:
            print(f"[Sequence] ❌ Erro ao enviar para {phone}: {e}")
        
        # Atualizar enrollment: avançar step ou concluir
        if enrollment.get("next_step_exists"):
            next_run = datetime.utcnow() + timedelta(minutes=enrollment.get("next_step_delay", 1440))
            print(f"[Sequence] Próximo passo em {next_run}")
            # Em produção: UPDATE sequence_enrollment SET current_step += 1, next_run_at = next_run
        else:
            print(f"[Sequence] Sequência concluída para {enrollment['contact_name']}")
            # Em produção: UPDATE sequence_enrollment SET status = 'COMPLETED', completed_at = now()

    # Pipeline
    pendentes = buscar_pendentes()
    
    for enrollment in pendentes:
        msg = gerar_mensagem(enrollment)
        enviar_mensagem(msg)

dag_instance = execute_sequences()
