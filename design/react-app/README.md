# VouDeBarba — MVP (React + Vite)

App de agendamento para barbearias, com dois perfis (Cliente e Barbearia).
Conversão do protótipo original para um projeto React componentizado, navegável
por rotas e alimentado por uma fonte de dados fictícia em JSON.

**Stack:** React 19, React Router 8 (modo declarativo — imports de `react-router`,
sem `react-router-dom`), Vite 7. Requer Node 22.22+.

## Rodando

```bash
npm install
npm run dev      # ambiente de desenvolvimento (http://localhost:5173)
npm run build    # build de produção em /dist
npm run preview  # serve o build
```

## Estrutura

```
src/
  main.jsx                 # ponto de entrada + BrowserRouter + AppProvider
  App.jsx                  # layout base (Header + main + Toast) e rotas
  index.css                # reset, fontes, variáveis de cor, media queries
  data/
    db.json                # DADOS FICTÍCIOS: barbearias, serviços, barbeiros, horários e agendamentos
  utils/
    format.js              # helpers puros: datas, moeda, iniciais, geração de horários
  context/
    AppContext.jsx         # estado global (perfil, usuário, barbearias, agendamentos, toast) + ações
  components/
    Header.jsx             # topo com navegação + alternância de perfil
    Toast.jsx              # notificação flutuante
    ShopCard.jsx           # card de barbearia (home)
    PhotoPlaceholder.jsx   # placeholder listrado de imagem
    StatusBadge.jsx        # selo de status do agendamento
    DateChips.jsx          # tira de datas (reutilizada em agendamento e agenda)
    StepHeading.jsx        # título numerado de etapa
  pages/
    HomePage.jsx           # lista/busca de barbearias
    ShopDetailPage.jsx     # detalhes + fluxo de agendamento (serviço, barbeiro, data, horário)
    AuthPage.jsx           # login / cadastro
    ForgotPasswordPage.jsx # recuperação de senha (pedir link -> redefinir)
    AppointmentsPage.jsx   # meus agendamentos (próximos + histórico)
    AgendaPage.jsx         # painel da barbearia: agenda do dia
    ConfigPage.jsx         # configurações: dados, serviços, barbeiros, horários
```

## Rotas

| Rota                  | Tela                          | Perfil    |
|-----------------------|-------------------------------|-----------|
| `/`                   | Barbearias (home/busca)       | Cliente   |
| `/barbearia/:id`      | Detalhes + agendamento        | Cliente   |
| `/entrar`             | Login / cadastro              | —         |
| `/recuperar-senha`    | Recuperação de senha          | —         |
| `/meus-agendamentos`  | Meus agendamentos             | Cliente   |
| `/agenda`             | Agenda do dia                 | Barbearia |
| `/configuracoes`      | Configurações da barbearia    | Barbearia |

Alternar entre **Cliente** e **Barbearia** no topo navega para a tela inicial de cada perfil.

## Dados

Tudo vem de `src/data/db.json` (mock em memória). As datas dos agendamentos usam
`dayOffset` relativo a "hoje" e são convertidas em datas reais ao carregar, então a
agenda sempre mostra atendimentos do dia. As alterações (novos agendamentos, status,
serviços, barbeiros, horários) ficam apenas no estado em memória — recarregar a página
restaura os dados originais. Para persistir de verdade, troque as ações do `AppContext`
por chamadas a uma API.
