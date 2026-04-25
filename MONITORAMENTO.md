# SOARES HUB CRM - Guia de Monitoramento

## Apache Airflow

### Alertas de Falha
```python
from airflow.utils.email import send_email

def failure_callback(context):
    send_email(
        to='admin@soareshub.com',
        subject='DAG Falhou',
        html_content=f'DAG {context["dag"].dag_id} falhou na task {context["task"].task_id}'
    )

# Adicionar ao default_args
default_args = {
    'on_failure_callback': failure_callback,
    ...
}
```

### Métricas a Monitorar
- Taxa de sucesso das DAGs (>95%)
- Tempo de execução das tarefas
- Uso de recursos (CPU, memória)
- Número de tarefas em fila

## Backend (Node.js)

### PM2 Monitoring
```bash
pm2 monit
pm2 logs
pm2 reloadLogs
```

### Health Checks
- Endpoint `/health` para verificações automáticas
- Monitoramento de memória e CPU
- Alertas para downtime > 5 minutos

## Frontend

### Performance Monitoring
- Core Web Vitals (Lighthouse)
- Tempo de carregamento das páginas
- Taxa de erro JavaScript

## Alertas
- Slack/Discord para notificações críticas
- Email para relatórios diários
- Dashboard com métricas em tempo real