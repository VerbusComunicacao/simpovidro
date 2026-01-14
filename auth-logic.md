# Análise da Lógica de Autenticação no Projeto TabNews

Este documento resume a lógica de autenticação implementada no frontend do projeto TabNews, com foco no fluxo de login, gerenciamento de sessão e proteção de rotas.

## Fluxo de Autenticação

O processo de autenticação de um usuário no TabNews segue os seguintes passos:

1.  **Interface de Login**: O usuário insere seu email e senha na página de login, que é renderizada pelo componente `pages/login/index.public.js`.

2.  **Submissão do Formulário**: Ao submeter o formulário, uma requisição `POST` é enviada para o endpoint da API `/api/v1/sessions`.

3.  **Criação da Sessão**: O endpoint `/api/v1/sessions/index.public.js` é responsável por:
    - Validar os dados de entrada (email e senha).
    - Verificar se o usuário existe no banco de dados.
    - Comparar a senha fornecida com o hash armazenado.
    - Se as credenciais estiverem corretas, uma nova sessão é criada na tabela `sessions` do banco de dados.

4.  **Cookie de Sessão**: Após a criação da sessão, um cookie HTTP-only chamado `session_id` é enviado na resposta para o navegador do usuário. Este cookie contém o token da sessão e tem um tempo de expiração de 30 dias.

## Gerenciamento de Sessão

O gerenciamento da sessão do usuário é realizado da seguinte forma:

- **Middleware de Injeção de Usuário**: A função `authentication.injectAnonymousOrUser` atua como um middleware em todas as requisições. Ela verifica a presença do cookie `session_id`:
  - Se o cookie existir e for válido, os dados do usuário autenticado são injetados no objeto `request.context`.
  - Caso contrário, um objeto de usuário anônimo é injetado.

- **Validação da Sessão**: O modelo `models/session.js` é responsável por validar, criar e expirar as sessões. Um token de sessão é uma string hexadecimal de 96 caracteres, e cada sessão tem uma data de expiração.

- **Contexto do Usuário**: O `UserProvider` em `pages/_app.public.js` envolve toda a aplicação, disponibilizando o contexto do usuário para todas as páginas através do hook `useUser`.

## Proteção de Rotas

As rotas que exigem autenticação são protegidas utilizando um sistema de features (permissões):

- **Middleware de Autorização**: A função `authorization.canRequest(feature)` é um middleware que verifica se o usuário autenticado possui a feature necessária para acessar uma determinada rota.

- **Controle de Acesso**: Se o usuário não possuir a feature exigida, a requisição é rejeitada com um erro de "Acesso Negado" (Forbidden).

Este resumo abrange os principais aspectos da lógica de autenticação no frontend do projeto TabNews, desde o login do usuário até a proteção de rotas baseada em permissões.
