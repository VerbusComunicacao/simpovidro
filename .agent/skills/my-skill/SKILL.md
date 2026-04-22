---
name: my-skill
description: Use em toda task.
---

ste documento serve como um guia de contexto para assistentes de IA que trabalharem neste projeto. Ele descreve os padrões arquiteturais e convenções adotadas.

## 🏗️ Arquitetura e Estrutura de Pastas

O projeto segue uma adaptação do padrão **MVP (Model-View-Presenter/Controller)**, segregando responsabilidades de forma clara:

1.  **`/models`**: Contém a lógica de negócio e interações diretas com o banco de dados.
    - Exemplo: `models/user.js`, `models/sale.js`.
    - Devem ser funções assíncronas que utilizam o `infra/database.js`.
    - Devem lançar erros customizados de `infra/errors.js`.

2.  **`/infra`**: Contém a infraestrutura compartilhada.
    - `infra/controller.js`: Centraliza o roteamento, injeção de usuários (`injectAnnonymousOrUser`), tratamento de erros (`onError`) e validação de permissões (`canRequest`).
    - `infra/database.js`: Abstração para consultas ao PostgreSQL.
    - `infra/errors.js`: Classes de erro customizadas (ValidationError, NotFoundError, etc).

3.  **`/pages/api`**: Atuam como os Presenters/Controllers externos.
    - Utilizam `next-connect` para gerenciamento de rotas e middlewares.
    - **Regra de Ouro**: O arquivo de rota deve ser o mais magro possível, delegando a lógica para o `model` e a segurança para o `controller`.
    - Estrutura de pastas para rotas dinâmicas: `[id]/index.js` (exigência do projeto).

4.  **`/tests`**: Testes de integração robustos.
    - `/tests/orchestrator.js`: "Canivete suíço" para testes. Contém helpers para criar usuários, sessões, hotéis, limpar banco, etc.
    - `/tests/api/integration`: Segue a mesma estrutura de pastas da API.
    - Os testes dentro de integration seguem um padrão de rota (GET, POST, PUT, DELETE) exemplo: post.test.js, get.test.js, put.test.js, delete.test.js.
    - IMPORTANTE: os testes são a base do código e devem possuir o caminho feliz e o caminho triste, cada situação precisa de um teste validado, com dados concretos.

## 🔐 Segurança e Autorização

- **`models/authorization.js`**: Implementa o controle de acesso baseado em features (`can`, `filterOutput`).
- **Middleware `canRequest(feature)`**: Usado nas rotas para bloquear acesso antes mesmo de chegar ao handler.
- **Injeção de Contexto**: O `controller.injectAnnonymousOrUser` coloca o usuário (autenticado ou anônimo) em `request.context.user`.

## 🛠️ Convenções de Código

- Utiliza **JavaScript (Esm/Modules)**.
- Validação de entrada usando `joi` ou funções auxiliares em `infra/validator.js`.
- Mensagens de erro sempre amigáveis com `message` e `action`.
- Testes rodam com `jest` e exigem os serviços (DB, Email) via `orchestrator.waitForAllServices()`.

## 📝 Exemplo de Fluxo

1.  **Rota (`pages/api/...`)**: Recebe request -> Chama middleware de autorização -> Chama função do Model -> Retorna JSON.
2.  **Model (`models/...`)**: Valida campos -> Executa query no DB -> Retorna objeto ou lança erro.
3.  **Teste (`tests/...`)**: Limpa banco -> Cria cenário via `orchestrator` -> Faz `fetch` na API -> Valida status e corpo.

## 💻 Ambiente do Assistente (AI Agent)

Para que o Assistente de IA consiga executar comandos de terminal (`npm`, `node`, `docker`) com sucesso neste projeto, é necessário garantir que os caminhos dos binários estejam no `PATH`.

**Caminhos Obrigatórios:**
- `/opt/homebrew/bin` (Node e NPM)
- `/usr/local/bin` (Docker)

> [!TIP]
> Antes de rodar qualquer script ou teste, concatene os caminhos:
> `export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"`
