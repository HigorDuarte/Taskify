# Taskify API

API REST para gerenciamento de projetos e tarefas, construída com foco em **autenticação e autorização**: JWT, hash de senhas, controle de acesso por papel (`USER` / `ADMIN`) e por propriedade (cada usuário só enxerga e altera o que é seu).

Projeto backend (sem front-end) desenvolvido do zero para consolidar os conceitos de segurança em APIs com Node.js e TypeScript.

## Tecnologias

- **Node.js** + **Express**
- **TypeScript**
- **Prisma ORM** (v7) com **PostgreSQL**
- **Docker** (banco de dados em container)
- **JSON Web Token** (`jsonwebtoken`) para autenticação
- **bcrypt** para hash de senhas
- **Zod** para validação de dados de entrada e das variáveis de ambiente

## Funcionalidades

- Cadastro de usuários com senha armazenada apenas como hash (bcrypt)
- Login que gera um token JWT (id no `sub` e `role` no payload)
- Middleware de autenticação (`verify` do token e `request.user`)
- Middleware de autorização por papel (`USER` e `ADMIN`)
- Autorização por propriedade: usuários só acessam os próprios projetos e tarefas
- CRUD de projetos e de tarefas, com status em ambos
- Regras de negócio protegendo a integridade dos dados
- Seed para criação do primeiro usuário `ADMIN`
- Tratamento de erros centralizado (`AppError` + middleware de erro)
- Variáveis de ambiente validadas com Zod na inicialização

## Modelo de dados

```
User (1) ──── (N) Project (1) ──── (N) Task
```

| Model | Campos principais |
|---|---|
| **User** | `id`, `name`, `email` (único), `passwordHash`, `role` (`USER` \| `ADMIN`), `createdAt` |
| **Project** | `id`, `title`, `description?`, `status` (`ACTIVE` \| `COMPLETED`), `ownerId`, `createdAt` |
| **Task** | `id`, `title`, `description?`, `status` (`TODO` \| `IN_PROGRESS` \| `DONE`), `projectId`, `createdAt` |

Deletar um usuário apaga seus projetos, e deletar um projeto apaga suas tarefas (`onDelete: Cascade`).

## Rotas

### Públicas

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/users` | Cadastra um usuário (sempre com role `USER`) |
| `POST` | `/sessions` | Login: devolve o token JWT e os dados do usuário |

### Protegidas (header `Authorization: Bearer <token>`)

| Método | Rota | Quem acessa | Descrição |
|---|---|---|---|
| `GET` | `/users` | `ADMIN` | Lista todos os usuários (sem o hash da senha) |
| `DELETE` | `/users/:id` | Próprio usuário ou `ADMIN` | Remove o usuário |
| `POST` | `/projects` | Autenticado | Cria um projeto (o dono é o usuário do token) |
| `GET` | `/projects` | Autenticado | `USER` vê só os seus; `ADMIN` vê todos |
| `PATCH` | `/projects/:id` | Dono ou `ADMIN` | Atualiza título, descrição e status |
| `DELETE` | `/projects/:id` | Dono ou `ADMIN` | Remove o projeto e suas tarefas |
| `POST` | `/projects/:projectId/tasks` | Dono do projeto ou `ADMIN` | Cria uma tarefa no projeto |
| `GET` | `/projects/:projectId/tasks` | Dono do projeto ou `ADMIN` | Lista as tarefas do projeto |
| `PATCH` | `/tasks/:taskId` | Dono do projeto ou `ADMIN` | Atualiza título, descrição e status |
| `DELETE` | `/tasks/:taskId` | Dono do projeto ou `ADMIN` | Remove a tarefa (somente se estiver `DONE`) |

## Autenticação e autorização

**Autenticação:** no login, a senha enviada é comparada com o hash do banco (`bcrypt.compare`). Se bater, o servidor assina um JWT com `sub` (id do usuário) e `role`. Nas rotas protegidas, o middleware `ensureAuthenticated` valida a assinatura e a expiração do token e preenche `request.user`.

**Autorização por papel:** o middleware `verifyUserAuthorization(["ADMIN"])` bloqueia, com `403`, usuários sem o papel exigido.

**Autorização por propriedade:** nas rotas de projetos e tarefas, a checagem confere se o recurso pertence ao usuário do token. Para não revelar a existência de recursos alheios, tentar acessar o projeto ou a tarefa de outra pessoa retorna `404`, a mesma resposta de um recurso inexistente. `ADMIN` ignora essa checagem.

**Decisões de segurança:**

- O cadastro público nunca cria `ADMIN` e nunca aceita `role` ou `ownerId` vindos do body.
- O primeiro `ADMIN` é criado por um seed, com credenciais lidas de variáveis de ambiente.
- O `passwordHash` nunca é devolvido pela API.
- Login com e-mail inexistente e com senha errada retorna a mesma mensagem (`401`).
- E-mails são normalizados (`trim` + minúsculas).

## Regras de negócio

- Um usuário com projetos `ACTIVE` não pode ser deletado (`409 Conflict`).
- Uma tarefa só pode ser deletada se estiver com status `DONE` (`409 Conflict`).

## Como rodar localmente

### Pré-requisitos

- Node.js 20+
- Docker

### Passo a passo

```bash
# 1. Clone o repositório e instale as dependências
git clone https://github.com/HigorDuarte/Taskify.git
cd Taskify
npm install

# 2. Suba o PostgreSQL em um container
docker run --name taskify-db -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=taskify \
  -p 5432:5432 -d postgres

# 3. Configure as variáveis de ambiente
cp .env.example .env
# edite o .env com a sua DATABASE_URL, um JWT_SECRET longo e aleatório
# e os dados do usuário admin

# 4. Rode as migrations e gere o Prisma Client
npx prisma migrate dev
npx prisma generate

# 5. Crie o usuário admin
npm run seed

# 6. Inicie o servidor
npm run dev
```

Para gerar um `JWT_SECRET` seguro:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

O seed usa `upsert`, então pode ser executado mais de uma vez sem duplicar o admin. Se já existir um usuário com o e-mail do admin, ele não é alterado.

### Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `PORT` | Porta do servidor (padrão `3333`) |
| `NODE_ENV` | `development`, `test` ou `production` (padrão `development`) |
| `DATABASE_URL` | String de conexão do PostgreSQL |
| `JWT_SECRET` | Segredo usado para assinar os tokens (mínimo de 32 caracteres) |
| `ADMIN_NAME` | Nome do usuário admin criado pelo seed |
| `ADMIN_EMAIL` | E-mail do usuário admin criado pelo seed |
| `ADMIN_PASSWORD` | Senha do usuário admin criado pelo seed (mínimo de 6 caracteres) |

As variáveis `ADMIN_*` são usadas apenas pelo seed.

## Estrutura do projeto

```
src/
  config/        # configuração do JWT
  controllers/   # users, sessions, projects e tasks
  database/      # instância do Prisma Client
  middlewares/   # autenticação, autorização por papel e erros
  routes/        # definição das rotas
  types/         # extensão do tipo Request do Express
  utils/         # AppError e funções reutilizáveis (findProjectOrFail, findTaskOrFail)
  env.ts         # validação das variáveis de ambiente
  app.ts
  server.ts
prisma/
  schema.prisma
  seed.ts        # criação do usuário admin
  migrations/
```

## Próximos passos

- [x] Seed para criação do primeiro usuário `ADMIN`
- [ ] Testes automatizados com Jest e Supertest (auth, autorização por papel e por propriedade)
- [ ] Refresh token (access token curto + refresh token)

## Aprendizados

Este projeto foi feito para praticar, do zero: modelagem de banco com relações no Prisma, hash de senhas, emissão e verificação de JWT, diferença entre autenticação e autorização, e os limites do JWT (como a role ficar "congelada" dentro do token até ele expirar).

## Autor

**Higor Duarte**, desenvolvedor backend em formação.

[GitHub](https://github.com/HigorDuarte)
