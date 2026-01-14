# Gerenciamento Simpovidro

Este sistema é destinado ao gerenciamento exclusivo de hospedagens para o evento **Simpovidro 2026**.

## Objetivo

Gerenciar as reservas e inscrições de hotéis parceiros para os participantes do Simpovidro.

## Funcionalidades Principais

- **Gerenciamento de Hotéis:** Cadastro, edição e listagem de informações detalhadas sobre os hotéis.
- **Gerenciamento de Quartos:** Configuração de tipos de quartos, categorias, preços e disponibilidade.
- **Gerenciamento de Hóspedes:** Cadastro e acompanhamento de dados dos participantes do evento.
- **Autenticação e Autorização:** Sistema de login para usuários e controle de acesso baseado em permissões.
- **Migrações de Banco de Dados:** Ferramentas para gerenciar e aplicar alterações na estrutura do banco de dados.
- **API RESTful:** Conjunto de endpoints para interação programática com o sistema.

## Tecnologias Utilizadas

Este projeto foi construído utilizando as seguintes tecnologias e bibliotecas:

- **Next.js:** Framework React para desenvolvimento de aplicações web com renderização do lado do servidor (SSR) e geração de sites estáticos (SSG).
- **React:** Biblioteca JavaScript para construção de interfaces de usuário.
- **PostgreSQL:** Sistema de gerenciamento de banco de dados relacional.
- **Tailwind CSS:** Framework CSS utilitário para estilização rápida e responsiva.
- **NextAuth.js:** Solução de autenticação completa para aplicações Next.js.
- **Radix UI:** Componentes de UI acessíveis e de alta qualidade para React.
- **Jest:** Framework de testes JavaScript para testes unitários e de integração.
- **Lucide React:** Biblioteca de ícones.

## Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

- Node.js (versão 18 ou superior)
- npm ou Yarn
- PostgreSQL

## Como Começar

Siga estas instruções para configurar e rodar o projeto localmente:

1.  **Clone o repositório:**

    ```bash
    git clone https://github.com/seu-usuario/simpovidro.git
    cd simpovidro
    ```

2.  **Instale as dependências:**

    ```bash
    npm install
    # ou yarn install
    ```

3.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env.development` na raiz do projeto, baseado no exemplo abaixo, e preencha com suas configurações:

    ```
    DATABASE_URL="postgresql://user:password@host:port/database"
    NEXTAUTH_URL="http://localhost:3000"
    NEXTAUTH_SECRET="your_nextauth_secret"
    # Adicione outras variáveis de ambiente necessárias aqui
    ```

4.  **Execute as migrações do banco de dados:**

    ```bash
    npm run migration:run
    ```

5.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    O aplicativo estará disponível em `http://localhost:3000`.

## Scripts Disponíveis

No diretório do projeto, você pode executar os seguintes scripts:

- `npm run dev`: Inicia o aplicativo em modo de desenvolvimento.
- `npm run build`: Constrói o aplicativo para produção em uma pasta `.next`.
- `npm start`: Inicia o servidor Next.js em modo de produção (após rodar `npm run build`).
- `npm run lint`: Executa o linter para identificar problemas de código.
- `npm run lint:fix`: Executa o linter e tenta corrigir automaticamente os problemas.
- `npm test`: Executa os testes unitários e de integração.
- `npm run test:watch`: Executa os testes em modo `watch`.
- `npm run migration:create [nome-da-migracao]`: Cria um novo arquivo de migração.
- `npm run migration:run`: Aplica todas as migrações pendentes ao banco de dados.
- `npm run migration:rollback`: Reverte a última migração aplicada ao banco de dados.

## Estrutura do Projeto

- `pages/`: Contém as páginas da aplicação e os endpoints da API (`pages/api`).
- `components/`: Componentes React reutilizáveis.
- `models/`: Definições de modelos de dados e lógica de negócio.
- `infra/`: Configurações de infraestrutura, como banco de dados e servidor web.
- `public/`: Arquivos estáticos.
- `styles/`: Estilos globais.
- `tests/`: Arquivos de testes.
