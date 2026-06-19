import json
import re
import shutil
import sqlite3
import unicodedata
from datetime import date, datetime, timedelta
from pathlib import Path

from repo import (
    usuario_repo,
    barbearia_repo,
    barbeiro_repo,
    servico_repo,
    agendamento_repo,
)
from model.usuario_model import Usuario
from model.barbearia_model import Barbearia, HorarioFuncionamento
from model.barbeiro_model import Barbeiro
from model.servico_model import Servico
from model.agendamento_model import Agendamento, StatusAgendamento
from util.config import APP_TIMEZONE, IS_DEVELOPMENT, SEED_DEMO
from util.security import criar_hash_senha
from util.logger_config import logger
from util.perfis import Perfil

# Caminho do arquivo de seed de usuários (raiz_do_projeto/data/admin_seed.json).
# Este arquivo é gerado/atualizado pelo scripts/configurar_projeto.py.
CAMINHO_SEED_USUARIOS = Path(__file__).resolve().parent.parent / "data" / "admin_seed.json"

# Senha padrão (em texto puro) usada por TODOS os usuários de demo criados pelo
# seed de barbearias. O hash é aplicado via criar_hash_senha ao inserir.
SENHA_PADRAO_SEED = "1234aA@#"


def _ler_usuarios_do_json() -> list[dict]:
    """
    Lê os usuários definidos em data/admin_seed.json.

    Returns:
        Lista de dicionários de usuários. Retorna lista vazia se o arquivo
        não existir, estiver vazio ou for inválido.
    """
    if not CAMINHO_SEED_USUARIOS.exists():
        return []
    try:
        dados = json.loads(CAMINHO_SEED_USUARIOS.read_text(encoding="utf-8"))
        return dados.get("usuarios", [])
    except (json.JSONDecodeError, OSError) as e:
        logger.error(
            f"Erro ao ler {CAMINHO_SEED_USUARIOS.name}: {e}. "
            "Usando perfis do enum como fallback."
        )
        return []


def _gerar_usuarios_dos_perfis() -> list[dict]:
    """
    Gera um usuário padrão para cada perfil do enum Perfil (fallback).

    Formato gerado por perfil:
    - nome: {Perfil} Padrão
    - email: padrao@{perfil}.com
    - senha: 1234aA@#
    - perfil: {Perfil}
    """
    usuarios = []
    for perfil_enum in Perfil:
        perfil_valor = perfil_enum.value
        usuarios.append({
            "nome": f"{perfil_valor} Padrão",
            "email": f"padrao@{perfil_valor.lower()}.com",
            "senha": "1234aA@#",
            "perfil": perfil_valor,
        })
    return usuarios


def carregar_usuarios_seed():
    """
    Carrega usuários padrão no banco de dados.

    Prioriza os usuários definidos em data/admin_seed.json (gerado pelo
    scripts/configurar_projeto.py). Caso o arquivo não exista ou esteja vazio/inválido,
    gera automaticamente 1 usuário para cada perfil do enum Perfil como fallback.

    Só insere usuários se não houver nenhum usuário cadastrado no banco.
    A senha de cada usuário é sempre armazenada com hash bcrypt.
    """
    # Verificar se já existem usuários cadastrados
    quantidade_usuarios = usuario_repo.obter_quantidade()
    if quantidade_usuarios > 0:
        logger.info(f"Já existem {quantidade_usuarios} usuários cadastrados. Seed não será executado.")
        return

    usuarios_seed = _ler_usuarios_do_json()
    if usuarios_seed:
        logger.info(
            f"Nenhum usuário encontrado. Carregando {len(usuarios_seed)} usuário(s) "
            f"de {CAMINHO_SEED_USUARIOS.name}..."
        )
    else:
        usuarios_seed = _gerar_usuarios_dos_perfis()
        logger.info(
            "Nenhum usuário encontrado e seed JSON ausente/vazio. "
            "Gerando usuários padrão a partir dos perfis..."
        )

    usuarios_criados = 0
    usuarios_com_erro = 0

    for dados in usuarios_seed:
        email = dados.get("email", "")
        try:
            usuario = Usuario(
                id=0,
                nome=dados.get("nome", ""),
                email=email,
                senha=criar_hash_senha(dados.get("senha", "")),
                perfil=dados.get("perfil", ""),
            )

            usuario_id = usuario_repo.inserir(usuario)
            if usuario_id:
                logger.info(f"✓ Usuário {email} criado com sucesso (ID: {usuario_id})")
                usuarios_criados += 1
            else:
                logger.error(f"✗ Falha ao inserir usuário {email} no banco")
                usuarios_com_erro += 1

        except sqlite3.Error as e:
            logger.error(f"✗ Erro ao processar usuário {email}: {e}")
            usuarios_com_erro += 1

    # Resumo
    logger.info(f"Resumo do seed de usuários: {usuarios_criados} criados, {usuarios_com_erro} com erro")


# ============================================================================
# Seed de DEMO de barbearias (somente desenvolvimento)
# ============================================================================

# Fonte dos dados de demo. Candidatos em ordem de prioridade:
# 1) backend/data/barbearias_demo.json — EMBARCADO na imagem Docker (COPY backend/),
#    garante o seed em produção (design/ NÃO é copiado para a imagem).
# 2) design/react-app/src/data/db.json — protótipo, disponível só em dev local.
_CANDIDATOS_DB_DEMO = [
    Path(__file__).resolve().parent.parent / "data" / "barbearias_demo.json",
    Path(__file__).resolve().parent.parent.parent
    / "design" / "react-app" / "src" / "data" / "db.json",
]


def _caminho_db_demo() -> Path | None:
    """Primeiro candidato de dados de demo que existir, ou None."""
    for caminho in _CANDIDATOS_DB_DEMO:
        if caminho.exists():
            return caminho
    return None

# Mapeia o nome da barbearia -> slug do arquivo de foto (seção FOTOS do contrato).
_FOTO_BARBEARIA = {
    "Barbearia Dom Bigode": "dom-bigode",
    "Navalha & Cia": "navalha-cia",
    "Old School Barber Club": "old-school",
    "Studio Corte Fino": "studio-corte-fino",
}

# Mapeia o nome do dono -> email (por ordem das barbearias no db.json).
_EMAIL_DONO = {
    "Barbearia Dom Bigode": "dom@voudebarba.com",
    "Navalha & Cia": "navalha@voudebarba.com",
    "Old School Barber Club": "oldschool@voudebarba.com",
    "Studio Corte Fino": "studio@voudebarba.com",
}

# Mapeia o nome do barbeiro -> slug do arquivo de foto (seção FOTOS do contrato).
_FOTO_BARBEIRO = {
    "Rafael Mendes": "rafael-mendes",
    "Tiago Alves": "tiago-alves",
    "Bruno Costa": "bruno-costa",
    "Léo Farias": "leo-farias",
    "Daniel Rocha": "daniel-rocha",
    "Igor Nunes": "igor-nunes",
    "Henrique Sá": "henrique-sa",
    "Vitor Lima": "vitor-lima",
}

# Email do cliente de demo principal (aparece como "Você" nos appointments).
_EMAIL_CLIENTE_DEMO = "cliente@voudebarba.com"


def _email_slug(nome: str) -> str:
    """Gera o local-part do e-mail a partir do nome, SEM acentos/caracteres
    especiais (ASCII): "André Melo" -> "andre.melo"."""
    sem_acento = (
        unicodedata.normalize("NFKD", nome)
        .encode("ascii", "ignore")
        .decode("ascii")
    )
    base = re.sub(r"[^a-z0-9]+", ".", sem_acento.strip().lower())
    return base.strip(".")


def _obter_ou_criar_usuario(nome: str, email: str, perfil: str) -> int:
    """Retorna o id do usuário com este email, criando-o se ainda não existir.

    A senha é sempre SENHA_PADRAO_SEED (com hash bcrypt).
    """
    existente = usuario_repo.obter_por_email(email)
    if existente:
        return existente.id

    usuario = Usuario(
        id=0,
        nome=nome,
        email=email,
        senha=criar_hash_senha(SENHA_PADRAO_SEED),
        perfil=perfil,
    )
    return usuario_repo.inserir(usuario)


def _to_min(hhmm: str) -> int:
    """Converte "HH:MM" em minutos desde a meia-noite."""
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


# Pool de clientes fictícios para gerar volume de agendamentos de demo.
_POOL_CLIENTES = [
    "Bruno Tavares", "Caio Ramos", "Diego Martins", "Eduardo Pinto",
    "Fábio Nunes", "Gustavo Reis", "Henrique Dias", "Igor Lopes",
    "Lucas Moura", "Murilo Castro", "Otávio Brito", "Paulo Vieira",
]


def carregar_barbearias_demo():
    """Carrega dados fictícios de barbearias para demonstração (apenas dev).

    IDEMPOTENTE: se já houver qualquer barbearia cadastrada, não faz nada.
    Lê o protótipo design/react-app/src/data/db.json e cria, via repos de
    domínio (sem SQL direto): donos (perfil Barbearia), clientes de demo,
    barbearias, horários de funcionamento, serviços, barbeiros e agendamentos.
    """
    if barbearia_repo.obter_todos():
        logger.info("Barbearias já existem. Seed de demo não será executado.")
        return

    caminho_demo = _caminho_db_demo()
    if caminho_demo is None:
        logger.error(
            "Arquivo de dados de demo não encontrado em nenhum candidato "
            f"({[str(p) for p in _CANDIDATOS_DB_DEMO]}). Seed de barbearias ignorado."
        )
        return

    try:
        dados = json.loads(caminho_demo.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as e:
        logger.error(f"Erro ao ler {caminho_demo.name}: {e}. Seed ignorado.")
        return

    shops = dados.get("shops", [])
    appointments = dados.get("appointments", [])

    # Contadores do resumo final.
    total_donos = 0
    total_clientes = 0
    total_barbearias = 0
    total_horarios = 0
    total_servicos = 0
    total_barbeiros = 0
    total_agendamentos = 0

    # Mapas de tradução id-do-db.json -> id-do-banco, escopados por barbearia.
    # shop_id (db.json) -> barbearia_id (banco)
    shop_to_barbearia: dict[int, int] = {}
    # (shop_id, service_id) -> objeto Servico persistido (para preço/duração)
    servico_por_chave: dict[tuple[int, int], Servico] = {}
    # (shop_id, barber_id) -> barbeiro_id (banco)
    barbeiro_por_chave: dict[tuple[int, int], int] = {}
    # Estruturas auxiliares para gerar agendamentos extras (volume de demo).
    barbeiros_por_shop: dict[int, list[int]] = {}
    servicos_por_shop: dict[int, list[Servico]] = {}
    horarios_por_shop: dict[int, dict[int, tuple[str, str]]] = {}

    # ----- Cliente de demo principal ("Você") -----
    cliente_demo_id = _obter_ou_criar_usuario(
        "Você", _EMAIL_CLIENTE_DEMO, Perfil.CLIENTE.value
    )
    total_clientes += 1

    # ----- Clientes a partir dos nomes em appointments -----
    # nome -> id de usuário (Cliente). "Você" já mapeado para o cliente demo.
    cliente_por_nome: dict[str, int] = {"Você": cliente_demo_id}
    for ap in appointments:
        nome = ap.get("client", "")
        if not nome or nome in cliente_por_nome:
            continue
        # Gera email determinístico a partir do nome (ex.: "Marcos Lima" ->
        # marcos.lima@voudebarba.com) para reuso idempotente por email.
        slug_email = _email_slug(nome)
        email = f"{slug_email}@voudebarba.com"
        cliente_id = _obter_ou_criar_usuario(nome, email, Perfil.CLIENTE.value)
        cliente_por_nome[nome] = cliente_id
        total_clientes += 1

    # ----- Barbearias + dono + horários + serviços + barbeiros -----
    for shop in shops:
        shop_id = shop["id"]
        nome_barbearia = shop["nome"]

        email_dono = _EMAIL_DONO.get(nome_barbearia)
        if not email_dono:
            logger.error(
                f"Barbearia '{nome_barbearia}' sem dono mapeado. Pulando."
            )
            continue
        # Nome do dono derivado da barbearia (perfil Barbearia).
        dono_id = _obter_ou_criar_usuario(
            f"Dono {nome_barbearia}", email_dono, Perfil.BARBEARIA.value
        )
        total_donos += 1

        slug_foto = _FOTO_BARBEARIA.get(nome_barbearia)
        foto_url = (
            f"/static/uploads/barbearias/{slug_foto}.webp" if slug_foto else None
        )

        barbearia = Barbearia(
            id=0,
            dono_id=dono_id,
            nome=nome_barbearia,
            descricao=shop.get("desc", ""),
            telefone=shop.get("tel", ""),
            endereco_texto=shop.get("endereco", ""),
            foto_url=foto_url,
            ativa=True,
        )
        barbearia_id = barbearia_repo.inserir(barbearia)
        shop_to_barbearia[shop_id] = barbearia_id
        total_barbearias += 1

        # Horários de funcionamento (dias "0".."6").
        horarios_obj = shop.get("horarios", {})
        horarios_lista: list[HorarioFuncionamento] = []
        for dia_str, h in horarios_obj.items():
            horarios_lista.append(
                HorarioFuncionamento(
                    id=0,
                    barbearia_id=barbearia_id,
                    dia_semana=int(dia_str),
                    hora_abertura=h.get("a", ""),
                    hora_fechamento=h.get("f", ""),
                    ativo=bool(h.get("on", False)),
                )
            )
        if horarios_lista:
            barbearia_repo.upsert_horarios(barbearia_id, horarios_lista)
            total_horarios += len(horarios_lista)
        horarios_por_shop[shop_id] = {
            h.dia_semana: (h.hora_abertura, h.hora_fechamento)
            for h in horarios_lista
            if h.ativo
        }

        # Serviços.
        for svc in shop.get("services", []):
            servico = Servico(
                id=0,
                barbearia_id=barbearia_id,
                nome=svc.get("nome", ""),
                descricao=svc.get("desc", ""),
                preco=float(svc.get("preco", 0)),
                duracao_min=int(svc.get("dur", 0)),
                ativo=bool(svc.get("ativo", True)),
            )
            servico_id = servico_repo.inserir(servico)
            servico.id = servico_id
            servico_por_chave[(shop_id, svc["id"])] = servico
            servicos_por_shop.setdefault(shop_id, []).append(servico)
            total_servicos += 1

        # Barbeiros.
        for brb in shop.get("barbers", []):
            slug_b = _FOTO_BARBEIRO.get(brb.get("nome", ""))
            foto_b = (
                f"/static/uploads/barbeiros/{slug_b}.webp" if slug_b else None
            )
            barbeiro = Barbeiro(
                id=0,
                barbearia_id=barbearia_id,
                nome=brb.get("nome", ""),
                especialidade=brb.get("espec", ""),
                foto_url=foto_b,
                ativo=True,
            )
            barbeiro_id = barbeiro_repo.inserir(barbeiro)
            barbeiro_por_chave[(shop_id, brb["id"])] = barbeiro_id
            barbeiros_por_shop.setdefault(shop_id, []).append(barbeiro_id)
            total_barbeiros += 1

    # ----- Agendamentos -----
    mapa_status = {
        "agendado": StatusAgendamento.AGENDADO,
        "realizado": StatusAgendamento.REALIZADO,
        "cancelado": StatusAgendamento.CANCELADO,
    }
    hoje = date.today()
    # (barbeiro_id, inicio_iso) já ocupados — evita choque de horário do barbeiro.
    usados: set[tuple[int, str]] = set()

    for ap in appointments:
        shop_id = ap["shopId"]
        barbearia_id = shop_to_barbearia.get(shop_id)
        if barbearia_id is None:
            continue

        servico = servico_por_chave.get((shop_id, ap["serviceId"]))
        barbeiro_id = barbeiro_por_chave.get((shop_id, ap["barberId"]))
        cliente_id = cliente_por_nome.get(ap.get("client", ""))
        if servico is None or barbeiro_id is None or cliente_id is None:
            logger.error(
                f"Agendamento {ap.get('id')} com referência inválida. Pulando."
            )
            continue

        data_ag = hoje + timedelta(days=int(ap.get("dayOffset", 0)))
        hora_str = ap.get("time", "00:00")
        hh, mm = (int(p) for p in hora_str.split(":"))
        inicio = datetime(
            data_ag.year, data_ag.month, data_ag.day, hh, mm, tzinfo=APP_TIMEZONE
        )
        fim = inicio + timedelta(minutes=servico.duracao_min)

        status = mapa_status.get(
            ap.get("status", "agendado"), StatusAgendamento.AGENDADO
        )

        agendamento = Agendamento(
            id=0,
            barbearia_id=barbearia_id,
            cliente_id=cliente_id,
            barbeiro_id=barbeiro_id,
            servico_id=servico.id,
            inicio=inicio,
            fim=fim,
            status=status,
            observacao=None,
        )
        agendamento_repo.inserir(agendamento)
        usados.add((barbeiro_id, inicio.isoformat()))
        total_agendamentos += 1

    # ----- Agendamentos extras (volume de demo em TODAS as barbearias) -----
    # Cria clientes do pool e espalha bookings por vários dias/barbeiros, dentro
    # do horário de funcionamento, sem colidir com horários já usados.
    pool_ids: list[int] = []
    for nome in _POOL_CLIENTES:
        slug_email = _email_slug(nome)
        cid = _obter_ou_criar_usuario(
            nome, f"{slug_email}@voudebarba.com", Perfil.CLIENTE.value
        )
        pool_ids.append(cid)
        total_clientes += 1

    todos_cliente_ids = list(
        dict.fromkeys(list(cliente_por_nome.values()) + pool_ids)
    )

    DIAS_OFFSET = [-9, -6, -4, -2, -1, 1, 2, 4, 6, 9]
    HORAS_BASE = ["09:30", "10:30", "11:30", "14:00", "15:00", "16:30", "17:30"]
    ci = 0
    for shop_id, barbearia_id in shop_to_barbearia.items():
        barbs = barbeiros_por_shop.get(shop_id, [])
        svcs = servicos_por_shop.get(shop_id, [])
        hor = horarios_por_shop.get(shop_id, {})
        if not barbs or not svcs:
            continue
        for d_i, off in enumerate(DIAS_OFFSET):
            data_ag = hoje + timedelta(days=off)
            dia = (data_ag.weekday() + 1) % 7  # py Seg=0 -> nosso 0=Dom
            janela = hor.get(dia)
            if not janela:
                continue  # barbearia fechada nesse dia
            a_min, f_min = _to_min(janela[0]), _to_min(janela[1])
            for k in range(2):
                barbeiro_id = barbs[(d_i + k) % len(barbs)]
                svc = svcs[(d_i + k) % len(svcs)]
                h_min = _to_min(HORAS_BASE[(d_i * 2 + k) % len(HORAS_BASE)])
                if h_min < a_min or h_min + svc.duracao_min > f_min:
                    continue
                hh, mm = divmod(h_min, 60)
                inicio = datetime(
                    data_ag.year, data_ag.month, data_ag.day, hh, mm,
                    tzinfo=APP_TIMEZONE,
                )
                chave = (barbeiro_id, inicio.isoformat())
                if chave in usados:
                    continue
                usados.add(chave)
                if off < 0:
                    status = (
                        StatusAgendamento.CANCELADO
                        if (d_i + k) % 5 == 0
                        else StatusAgendamento.REALIZADO
                    )
                else:
                    status = StatusAgendamento.AGENDADO
                agendamento_repo.inserir(
                    Agendamento(
                        id=0,
                        barbearia_id=barbearia_id,
                        cliente_id=todos_cliente_ids[ci % len(todos_cliente_ids)],
                        barbeiro_id=barbeiro_id,
                        servico_id=svc.id,
                        inicio=inicio,
                        fim=inicio + timedelta(minutes=svc.duracao_min),
                        status=status,
                        observacao=None,
                    )
                )
                ci += 1
                total_agendamentos += 1

    logger.info(
        "Resumo do seed de barbearias: "
        f"{total_donos} donos, {total_clientes} clientes, "
        f"{total_barbearias} barbearias, {total_horarios} horários, "
        f"{total_servicos} serviços, {total_barbeiros} barbeiros, "
        f"{total_agendamentos} agendamentos."
    )


def _aplicar_avatar(usuario_id: int, origem: Path) -> bool:
    """Copia o avatar de demo para o caminho de foto do usuário (static/img/usuarios/{id}.jpg)."""
    from util.foto_util import PASTA_FOTOS

    if not origem.exists():
        return False
    try:
        PASTA_FOTOS.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(origem, PASTA_FOTOS / f"{usuario_id:06d}.jpg")
        return True
    except OSError as e:
        logger.warning(f"Falha ao aplicar avatar do usuário {usuario_id}: {e}")
        return False


def garantir_avatars_demo():
    """Atribui os avatares de demo aos usuários (idempotente; roda a cada boot).

    Donos (perfil Barbearia) recebem o LOGO da sua barbearia; clientes recebem o
    avatar correspondente ao slug do e-mail. As fotos vêm de data/avatars/ (embarcado
    na imagem). Reaplica a cada boot porque static/img/usuarios não é volume.
    """
    base = Path(__file__).resolve().parent.parent / "data" / "avatars"
    if not base.exists():
        logger.info("Pasta de avatares de demo ausente; etapa ignorada.")
        return

    aplicados = 0
    # Donos -> logo da barbearia (email do dono -> slug da foto da barbearia).
    email_para_slug = {
        _EMAIL_DONO[nome]: _FOTO_BARBEARIA[nome]
        for nome in _EMAIL_DONO
        if nome in _FOTO_BARBEARIA
    }
    for email, slug in email_para_slug.items():
        u = usuario_repo.obter_por_email(email)
        if u and _aplicar_avatar(u.id, base / "barbearias" / f"{slug}.jpg"):
            aplicados += 1

    # Clientes -> avatar pelo slug do e-mail (local-part).
    for u in usuario_repo.obter_todos_por_perfil(Perfil.CLIENTE.value):
        slug = u.email.split("@")[0]
        if _aplicar_avatar(u.id, base / "clientes" / f"{slug}.jpg"):
            aplicados += 1

    logger.info(f"Avatares de demo aplicados: {aplicados}.")


def inicializar_dados():
    """Inicializa todos os dados seed"""
    logger.info("=" * 50)
    logger.info("Iniciando carga de dados seed...")
    logger.info("=" * 50)

    try:
        # Admin/usuários-base: SEMPRE carregados (dev e produção). É a única
        # forma de ter um administrador inicial num banco recém-criado.
        carregar_usuarios_seed()

        # Dados de DEMO de domínio (clientes/registros de exemplo): só em
        # desenvolvimento/QA. inicializar_dados() roda incondicionalmente no
        # startup, então sem este gate os dados de demo vazariam para produção
        # na primeira subida com banco vazio (ver docs/FORKING.md §10e).
        #
        # Fork: registre aqui suas funções carregar_<dominio>_demo() — elas
        # devem ser idempotentes (guarda de tabela vazia). Ex.:
        #     carregar_imoveis_demo()
        if SEED_DEMO:
            origem = "dev" if IS_DEVELOPMENT else "SEED_DEMO=true"
            logger.info(f"Seed de dados demo habilitado ({origem}).")
            carregar_barbearias_demo()
            # Avatares/logos de demo (idempotente; reaplica a cada boot).
            garantir_avatars_demo()
        else:
            logger.info("Seed de dados demo desabilitado (SEED_DEMO!=true e não-dev).")

        logger.info("=" * 50)
        logger.info("Dados seed carregados!")
        logger.info("=" * 50)
    except sqlite3.Error as e:
        logger.error(f"Erro crítico ao inicializar dados seed: {e}", exc_info=True)
