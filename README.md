# FAZ — sistema de gestão da Agência Mona

Sistema próprio de jobs, pauta, clientes, fees, campanhas e horas, feito a partir da auditoria do SiGA SW (`../Auditoria_SiGA_SW_Agencia_Mona.md`) e já com as correções que ela apontou.

## Como rodar (neste computador)

```bash
cd faz
npm run dev
```

Abra http://localhost:3000.

### Logins
- Usuários criados pelo seed: **nome@mona.local**. Exemplos: `admin.mona@mona.local` (Administrador) e `joao@mona.local` (Colaborador).
- Senha inicial de todos: o valor de `SEED_PASSWORD` no arquivo `.env`.
- Troque a senha em **Meu perfil**. O admin troca e-mails, perfis e custo/hora em **Configurações › Usuários**.

### Banco de dados
- Banco SQLite no arquivo `prisma/faz.db`.
- `npm run db:reset`: apaga tudo e recria só a base (situações, peças, clientes e equipe), **sem** os jobs de demonstração. Rode antes de começar a usar de verdade.
- `npm run db:demo`: adiciona os dados de demonstração (6 jobs, 1 fee e 1 campanha da Cordial Peugeot).

## Módulos
| Módulo | O que faz |
|---|---|
| Painel | Meus jobs por prazo, atrasados, tarefas, horas da semana e últimos comentários |
| Pauta | Lista ou Kanban, agrupada por prazo, situação ou responsável; filtros; arrastar o card muda a situação |
| Jobs | Número sequencial; cliente, campanha, fee e peça; briefing, links, até 5 responsáveis, estrelas, prioridade; abas de tarefas, alterações (A, B, C… com motivo obrigatório), comentários, horas e histórico; duplicar |
| Clientes | Cadastro com nome padronizado (sem duplicados); fees, campanhas, jobs e resumo do mês |
| Campanhas | Agrupam jobs, com progresso, horas × estimado e verba |
| Horas | Cronômetro no topo de todas as telas, lançamento manual, relatório por pessoa e cliente, exportação em CSV |
| Rentabilidade | Receita dos fees × custo das horas por cliente, horas contratadas × usadas, estimado × realizado por peça, motivos de alteração |
| Configurações | Tabela de peças (bloqueia nomes repetidos), situações do fluxo, usuários e custo/hora, lixeira |

## Perfis
- **Administrador:** tudo.
- **Coordenação:** cadastros, fees, campanhas, peças, rentabilidade e lixeira.
- **Colaborador:** jobs, pauta, as próprias horas. Não vê valores, rentabilidade nem lixeira.

## Correções em relação ao SiGA (da auditoria)
- Peça, prazo e responsável obrigatórios; o tempo estimado vem da tabela de peças.
- Motivo obrigatório em toda alteração, que vira relatório.
- Tabela de peças sem duplicadas; clientes salvos em maiúsculas e sem repetição.
- Fluxo de 10 situações em ordem lógica (editável).
- Só Admin e Coordenação mandam jobs para a lixeira, e dá para restaurar.
- Fee e campanha ligados ao job, com a rentabilidade calculada automaticamente.

## Próximas etapas sugeridas
1. Hospedar na internet (ex.: Vercel + PostgreSQL/Supabase) para a equipe acessar de qualquer lugar. Basta trocar `provider` no `prisma/schema.prisma` e a `DATABASE_URL`.
2. Upload de arquivos no job (ou integração com o Google Drive).
3. Financeiro: contas a pagar e receber, com as parcelas dos fees geradas automaticamente.
4. Área do cliente para aprovação de jobs.
5. IA: assistente de briefing e análise da pauta.
6. Notificações por e-mail e WhatsApp.
