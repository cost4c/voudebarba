# VouDeBarba

> Aplicativo de agendamento em barbearias.

Este repositório é a base para a sua **atividade do Projeto Integrador**. Siga este guia do começo ao fim — nada é pulado. Ao final você terá o projeto rodando no seu computador e estará pronto para implementar a sua feature.

---

## 1. Programas que você precisa instalar

Instale os quatro programas abaixo (se já tiver algum, pule).

| Programa | Para quê serve | Onde baixar |
|---|---|---|
| **Git** | Baixar (clonar) o projeto e salvar seu trabalho | https://git-scm.com/downloads |
| **Python 3.11+** | Rodar o *backend* (o servidor que guarda os dados) | https://www.python.org/downloads/ |
| **Bun** | Rodar o *frontend* (a parte visual, no navegador) | https://bun.sh |
| **VSCode** | O editor de código onde você vai trabalhar | https://code.visualstudio.com |

Depois de instalar, **confirme** abrindo um terminal e digitando:

```bash
git --version
python --version      # precisa mostrar 3.11 ou maior
bun --version
```

> ⚠️ Se `python --version` mostrar algo diferente de 3.11+ (ou der erro), instale o Python 3.11 ou superior antes de continuar. O arquivo `.python-version` do projeto pode apontar para uma versão que você não tem — não tem problema, vamos criar um ambiente isolado mais à frente.

---

## 2. Extensões do VSCode

Abra o VSCode, clique no ícone de **Extensões** (quadradinhos na barra lateral) e instale:

- **Python** — suporte básico da linguagem Python (rodar, depurar).
- **Pylance** — autocompletar inteligente e detecção de erros no Python.
- **Python Debugger** — permite executar o backend passo a passo para achar erros.
- **Python Environments** — ajuda a selecionar o ambiente virtual (a `.venv`) certo.
- **ESLint** — aponta erros e problemas no código do frontend (TypeScript/React).
- **SQLite3 Editor** — abre e visualiza o banco de dados (`dados.db`) dentro do VSCode.
- **vscode-icons** — ícones bonitos nos arquivos (ajuda a se localizar).
- **HTML CSS Support** — autocompletar de classes CSS no frontend.

---

## 3. Clonar o projeto no VSCode

1. No VSCode, abra a paleta de comandos: **Ctrl+Shift+P** (no Mac: **Cmd+Shift+P**).
2. Digite **Git: Clone** e pressione Enter.
3. Cole o endereço do repositório:

   ```
   https://github.com/cost4c/voudebarba.git
   ```

4. Escolha uma pasta no seu computador para salvar o projeto.
5. Quando o VSCode perguntar, clique em **Abrir** para abrir o projeto clonado.

> Alternativa pelo terminal: `git clone https://github.com/cost4c/voudebarba.git` e depois **Arquivo → Abrir Pasta** no VSCode.

---

## 4. Criar uma branch para a sua atividade

Uma **branch** é uma "linha do tempo" separada do código, onde você faz suas mudanças sem bagunçar a versão principal (`main`). Crie a sua antes de programar.

No terminal do VSCode (**Terminal → Novo Terminal**), dentro da pasta do projeto:

```bash
git checkout -b minha-atividade
```

(Troque `minha-atividade` por um nome que faça sentido, ex.: `comodidades` ou `ranking-apostadores`.)

---

## 5. Preparar e rodar o **backend** (Python)

No terminal, entre na pasta `backend` e crie um **ambiente virtual** (uma "caixinha" isolada com as dependências do projeto):

```bash
cd backend
python -m venv .venv
```

Ative o ambiente:

- **Windows (PowerShell):** `.venv\Scripts\Activate.ps1`
- **Mac/Linux:** `source .venv/bin/activate`

Instale as dependências e rode o servidor:

```bash
pip install -r requirements.txt
python main.py
```

O backend sobe em **http://localhost:8415**. A documentação da API (Swagger) fica em **http://localhost:8415/docs**.

> Deixe esse terminal aberto rodando. Abra um **segundo terminal** para o frontend.

---

## 6. Preparar e rodar o **frontend** (Bun)

No segundo terminal, a partir da pasta do projeto:

```bash
cd frontend
bun install
bun run dev
```

O frontend abre em **http://localhost:5185**. **É por esse endereço que você acessa o sistema no navegador.** (Ele conversa sozinho com o backend.)

> Use **Bun** (não `npm`). Os comandos são `bun install` e `bun run dev`.

---

## 7. Entrar no sistema

Já existe um usuário **administrador** pronto para você testar as telas:

- **E-mail:** `voudebarba@ifes.site`
- **Senha:** `Admin!123`

(Outros tipos de usuário você pode criar pela própria tela de cadastro do sistema.)

---

## 8. Qual é a sua atividade

Cada aluno implementa **uma** feature, seguindo o tutorial passo a passo correspondente (na pasta `docs/`):

- **Aluno 1 → Avaliação do atendimento e faturamento do dia**
  Tutorial: [`docs/TutorialAluno1.md`](docs/TutorialAluno1.md)
- **Aluno 2 → Filtro de barbearias por serviço e relatório de ocupação**
  Tutorial: [`docs/TutorialAluno2.md`](docs/TutorialAluno2.md)

Abra o seu tutorial e siga **na ordem**, copiando o código exatamente como está. Cada passo só usa coisas que os passos anteriores já criaram.

---

## 9. Conferir se está tudo certo

Antes de entregar, rode os verificadores:

```bash
# a partir de frontend/  — checa os tipos do TypeScript
bun run build

# a partir de backend/   — roda os testes automatizados
python -m pytest
```

Se ambos passarem sem erro, sua implementação está saudável. 🎉

---

## 10. Salvar e enviar seu trabalho

```bash
git add .
git commit -m "feat: minha atividade"
git push origin minha-atividade
```

Depois, no GitHub, abra um **Pull Request** da sua branch para a `main` (ou entregue conforme o professor orientar).
