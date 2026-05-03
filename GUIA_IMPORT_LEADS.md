# GUIA DE INSTALAÇÃO E USO - LEADS IMPORT

## 1. INSTALAÇÃO DAS DEPENDÊNCIAS

### Frontend (para importação XLSX/CSV):
```bash
cd "C:\Users\Nelson\Desktop\SOARES HUB CRM\frontend"
npm install xlsx papaparse
```

### Dependências adicionadas ao `package.json`:
- `xlsx@^0.18.5` - Para ler arquivos Excel (.xlsx, .xls)
- `papaparse@^5.4.1` - Para parsing de CSV (alternativa nativa)

---

## 2. COMO USAR - CADASTRO MANUAL

### Passo a Passo:
1. **Acesse** `http://localhost:5173/leads`
2. **Clique** em "Novo Lead"
3. **Preencha** os campos:
   - **Nome Completo*** (obrigatório)
   - **WhatsApp/Telefone*** (obrigatório)
   - Instagram (opcional)
   - Origem (Manual, WhatsApp, Instagram, etc.)
   - Estágio do Funil (Novo, Qualificado, Proposta, etc.)
   - Temperatura (Quente, Morno, Frio)
   - Score (0-10)
   - Valor do Negócio (R$)
   - Estágio Interno (Qualificação, Objeções, etc.)
   - Observações
4. **Clique** em "Cadastrar"

✅ **Lead criado!** Contato será criado automaticamente se não existir.

---

## 3. COMO USAR - IMPORTAÇÃO CSV/XLSX

### 3.1. Baixar Modelo:
1. **Clique** em "Modelo" (botão verde)
2. Arquivo `modelo_importacao_leads.csv` será baixado
3. **Abra** no Excel/Google Sheets e preencha com seus dados:

| Campo | Obrigatório | Descrição |
|-------|-------------|-------------|
| name | ✅ SIM | Nome completo do contato |
| phone | ✅ SIM | Telefone com DDD (ex: 5511999999999) |
| instagram | ❌ NÃO | @usuario do Instagram |
| source | ❌ NÃO | Manual, whatsapp, instagram, referral, website |
| stage | ❌ NÃO | NOVO, QUALIFICADO, PROPOSTA, NEGOCIACAO, GANHO, PERDIDO |
| score | ❌ NÃO | Número de 0 a 10 |
| temperature | ❌ NÃO | QUENTE, MORNO, FRIO |
| deal_value | ❌ NÃO | Valor do negócio (ex: 500000) |
| notes | ❌ NÃO | Observações livres |

### 3.2. Exemplo de CSV:
```csv
name,phone,instagram,source,stage,score,temperature,deal_value,notes
João Silva,5511999999999,@joaosilva,whatsapp,NOVO,5,FRIO,500000,Cliente interessado em apartamentos
Maria Santos,5511888888888,@mariasantos,instagram,QUALIFICADO,7,MORNO,350000,Visita agendada
Pedro Lima,5511777777777,,referral,PROPOSTA,8,QUENTE,450000,Proposta enviada
```

### 3.3. Importar:
1. **Clique** em "Importar" (botão com ícone de upload)
2. **Selecione** seu arquivo `.csv` ou `.xlsx`
3. **Revise** os dados na tela de preview:
   - ✅ Todos os registros selecionados por padrão
   - Desmarque os que não deseja importar
   - Verifique se Nome e Telefone estão preenchidos
4. **Clique** em "Confirmar Importação (X)"
5. ✅ **Pronto!** Leads serão criados automaticamente

---

## 4. FORMATOS SUPORTADOS

| Formato | Extensão | Suporte | Observações |
|--------|----------|---------|-------------|
| CSV | `.csv` | ✅ Total | Parsing nativo (papaparse se instalado) |
| Excel | `.xlsx`, `.xls` | ⚠️ Requer `npm install xlsx` | Use o botão "Modelo" para baixar CSV |
| Texto | `.txt` | ❌ Não | Use CSV em vez disso |

---

## 5. ESTRUTURA DO BANCO

### O que acontece ao cadastrar/importar:
1. **Contato** (`contacts`):
   - Criado se telefone não existir na organização
   - Vinculado à organização do usuário logado

2. **Lead** (`leads`):
   - Criado com estágio, temperatura, score informados
   - Vinculado ao contato e organização
   - Valor do negócio e observações salvas

3. **Dados de Auditoria:**
   - `created_at`, `updated_at` preenchidos automaticamente
   - `organization_id` vinculado ao usuário

---

## 6. CHECKLIST DE TESTES

### Cadastro Manual:
- [ ] Abrir modal "Novo Lead"
- [ ] Preencher campos obrigatórios (nome, telefone)
- [ ] Clicar em "Cadastrar"
- [ ] Verificar se lead aparece na lista
- [ ] Editar lead (clique no lápis)
- [ ] Excluir lead (lixeira - soft delete)

### Importação CSV:
- [ ] Baixar modelo via botão "Modelo"
- [ ] Preencher com 3-5 leads
- [ ] Importar via botão "Importar"
- [ ] Revisar preview (selecionar/deselecionar)
- [ ] Confirmar importação
- [ ] Verificar leads na lista

### Importação XLSX (após `npm install xlsx`):
- [ ] Criar arquivo Excel com cabeçalhos corretos
- [ ] Importar via botão "Importar"
- [ ] Revisar preview
- [ ] Confirmar importação
- [ ] Verificar leads na lista

---

## 7. RESOLUÇÃO DE PROBLEMAS

### Erro: "Arquivos Excel requerem biblioteca xlsx"
**Solução:**
```bash
cd "C:\Users\Nelson\Desktop\SOARES HUB CRM\frontend"
npm install xlsx
```

### Erro: "Nome ou Telefone não preenchidos"
**Solução:** Verifique se as colunas `name` e `phone` estão preenchidas no arquivo.

### Erro: "Nenhum dado encontrado no arquivo"
**Solução:** 
- Verifique se o arquivo não está vazio
- Confira se a primeira linha tem os cabeçalhos corretos
- Use o modelo baixado como referência

### Lead não aparece na lista após importar:
**Solução:**
- Verifique o console do navegador (F12) para erros
- Confira se `organization_id` está correto no Supabase
- Verifique se o usuário está logado corretamente

---

## 8. PRÓXIMOS PASSOS RECOMENDADOS

1. **Testar Cadastro Manual** (prioridade ALTA)
2. **Testar Importação CSV** (prioridade ALTA)
3. **Instalar xlsx** para suporte a Excel (prioridade MÉDIA)
4. **Implementar histórico de importações** (prioridade BAIXA)
5. **Adicionar mapeamento de colunas personalizado** (prioridade BAIXA)

---

**Data:** 02/05/2026  
**Versão:** 2.1 - Leads Import Completo  
**Status:** 98% Completo (falta testes e xlsx real)  
**Autor:** Engenheiro de Software Full-Stack Sênior
