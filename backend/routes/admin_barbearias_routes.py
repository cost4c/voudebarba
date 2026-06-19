"""Rotas administrativas de Barbearias (API JSON) — admin-only.

O cadastro de barbearia é feito PELO ADMIN (SaaS vendido às barbearias): cria o
usuário dono (perfil Barbearia) + a barbearia + horários de funcionamento padrão,
numa operação composta com rollback manual (SQLite sem transação entre repos).
"""

from typing import Optional

from fastapi import APIRouter, HTTPException, Request, status

from dtos.barbearia_dto import (
    CriarBarbeariaAdminDTO,
    EditarBarbeariaAdminDTO,
    AtualizarStatusBarbeariaDTO,
)
from dtos.responses.barbearia_response import BarbeariaAdminResponse
from model.barbearia_model import Barbearia, HorarioFuncionamento
from model.usuario_model import Usuario
from model.usuario_logado_model import UsuarioLogado
from repo import barbearia_repo, usuario_repo
from util.api_helpers import checar_rate_limit
from util.auth_decorator import requer_autenticacao
from util.logger_config import logger
from util.perfis import Perfil
from util.rate_limiter import DynamicRateLimiter
from util.security import criar_hash_senha
from util.validation_helpers import verificar_email_disponivel


def _barbearia_admin_com_dono(barbearia_id: int) -> Optional[BarbeariaAdminResponse]:
    """Recarrega a barbearia já com dono_nome/email (via listagem admin)."""
    return next(
        (
            BarbeariaAdminResponse.de_barbearia(b)
            for b in barbearia_repo.obter_todos_admin()
            if b.id == barbearia_id
        ),
        None,
    )

router = APIRouter(prefix="/admin/barbearias")

admin_barbearias_limiter = DynamicRateLimiter(
    chave_max="rate_limit_admin_barbearias_max",
    chave_minutos="rate_limit_admin_barbearias_minutos",
    padrao_max=10,
    padrao_minutos=1,
    nome="admin_barbearias",
)

# Horário de funcionamento padrão de uma nova barbearia (0=Dom .. 6=Sáb).
_HORARIOS_PADRAO = [
    (0, False, "09:00", "18:00"),  # Domingo (fechado)
    (1, True, "09:00", "19:00"),
    (2, True, "09:00", "19:00"),
    (3, True, "09:00", "19:00"),
    (4, True, "09:00", "19:00"),
    (5, True, "09:00", "19:00"),
    (6, True, "09:00", "17:00"),  # Sábado
]


@router.get("", response_model=list[BarbeariaAdminResponse])
@requer_autenticacao([Perfil.ADMIN.value])
async def listar(request: Request, usuario_logado: Optional[UsuarioLogado] = None):
    """Lista todas as barbearias (inclusive inativas), com dados do dono."""
    assert usuario_logado is not None
    barbearias = barbearia_repo.obter_todos_admin()
    return [BarbeariaAdminResponse.de_barbearia(b) for b in barbearias]


@router.get("/{id}", response_model=BarbeariaAdminResponse)
@requer_autenticacao([Perfil.ADMIN.value])
async def obter(request: Request, id: int, usuario_logado: Optional[UsuarioLogado] = None):
    """Detalhe de uma barbearia (com dados do dono) para edição."""
    assert usuario_logado is not None
    resp = _barbearia_admin_com_dono(id)
    if resp is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Barbearia não encontrada."
        )
    return resp


@router.put("/{id}", response_model=BarbeariaAdminResponse)
@requer_autenticacao([Perfil.ADMIN.value])
async def editar(
    request: Request,
    id: int,
    dto: EditarBarbeariaAdminDTO,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Edita os dados da barbearia e do dono (nome/e-mail). Não altera perfil/senha."""
    assert usuario_logado is not None
    checar_rate_limit(admin_barbearias_limiter, request)

    barbearia = barbearia_repo.obter_por_id(id)
    if not barbearia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Barbearia não encontrada."
        )

    dono = usuario_repo.obter_por_id(barbearia.dono_id)
    if not dono:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Dono da barbearia não encontrado."
        )

    # E-mail do dono deve continuar único (ignorando o próprio dono).
    disponivel, mensagem_erro = verificar_email_disponivel(dto.dono_email, dono.id)
    if not disponivel:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "detail": mensagem_erro,
                "type": "conflict",
                "errors": {"dono_email": [mensagem_erro]},
            },
        )

    # Atualiza dados do dono (mantém perfil Barbearia e senha).
    dono.nome = dto.dono_nome
    dono.email = dto.dono_email
    if not usuario_repo.alterar(dono):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao atualizar o dono. Tente novamente.",
        )

    # Atualiza dados da barbearia.
    barbearia.nome = dto.nome
    barbearia.descricao = dto.descricao
    barbearia.telefone = dto.telefone
    barbearia.endereco_texto = dto.endereco_texto
    if not barbearia_repo.atualizar(barbearia):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao atualizar a barbearia. Tente novamente.",
        )

    logger.info(f"Barbearia {id} editada por admin {usuario_logado.id}")
    resp = _barbearia_admin_com_dono(id)
    assert resp is not None
    return resp


@router.post("", response_model=BarbeariaAdminResponse, status_code=status.HTTP_201_CREATED)
@requer_autenticacao([Perfil.ADMIN.value])
async def criar(
    request: Request,
    dto: CriarBarbeariaAdminDTO,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Cria o usuário dono (perfil Barbearia) + a barbearia + horários padrão.

    Rollback manual: se a inserção da barbearia falhar após criar o usuário,
    o usuário recém-criado é removido para não deixar conta órfã.
    """
    assert usuario_logado is not None
    checar_rate_limit(admin_barbearias_limiter, request)

    disponivel, mensagem_erro = verificar_email_disponivel(dto.dono_email)
    if not disponivel:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "detail": mensagem_erro,
                "type": "conflict",
                "errors": {"dono_email": [mensagem_erro]},
            },
        )

    # 1) Cria o usuário dono (perfil Barbearia).
    dono = Usuario(
        id=0,
        nome=dto.dono_nome,
        email=dto.dono_email,
        senha=criar_hash_senha(dto.dono_senha),
        perfil=Perfil.BARBEARIA.value,
    )
    dono_id = usuario_repo.inserir(dono)
    if not dono_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao criar o usuário dono. Tente novamente.",
        )

    # 2) Cria a barbearia vinculada — com rollback do usuário em caso de falha.
    try:
        barbearia = Barbearia(
            id=0,
            dono_id=dono_id,
            nome=dto.nome,
            descricao=dto.descricao,
            telefone=dto.telefone,
            endereco_texto=dto.endereco_texto,
            foto_url=None,
            ativa=True,
        )
        barbearia_id = barbearia_repo.inserir(barbearia)
        if not barbearia_id:
            raise RuntimeError("Falha ao inserir barbearia.")

        # 3) Horários de funcionamento padrão.
        horarios = [
            HorarioFuncionamento(
                id=0,
                barbearia_id=barbearia_id,
                dia_semana=dia,
                hora_abertura=abre,
                hora_fechamento=fecha,
                ativo=ativo,
            )
            for (dia, ativo, abre, fecha) in _HORARIOS_PADRAO
        ]
        barbearia_repo.upsert_horarios(barbearia_id, horarios)
    except Exception as e:
        # Rollback compensatório: remove o usuário órfão.
        usuario_repo.excluir(dono_id)
        logger.error(f"Falha ao criar barbearia (rollback do dono {dono_id}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao cadastrar a barbearia. Tente novamente.",
        )

    logger.info(
        f"Barbearia '{dto.nome}' (id {barbearia_id}) e dono {dono_id} "
        f"criados por admin {usuario_logado.id}"
    )
    criada = barbearia_repo.obter_por_id(barbearia_id)
    criada.dono_nome = dto.dono_nome
    criada.dono_email = dto.dono_email
    return BarbeariaAdminResponse.de_barbearia(criada)


@router.patch("/{id}/status", response_model=BarbeariaAdminResponse)
@requer_autenticacao([Perfil.ADMIN.value])
async def alterar_status(
    request: Request,
    id: int,
    dto: AtualizarStatusBarbeariaDTO,
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Ativa/desativa uma barbearia (controle de disponibilidade no SaaS)."""
    assert usuario_logado is not None
    checar_rate_limit(admin_barbearias_limiter, request)

    barbearia = barbearia_repo.obter_por_id(id)
    if not barbearia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Barbearia não encontrada."
        )

    barbearia_repo.atualizar_status(id, dto.ativa)
    logger.info(
        f"Barbearia {id} {'ativada' if dto.ativa else 'desativada'} "
        f"por admin {usuario_logado.id}"
    )

    # Recarrega com dados do dono para a resposta da listagem admin.
    atualizada = next(
        (b for b in barbearia_repo.obter_todos_admin() if b.id == id), None
    )
    if atualizada is None:
        atualizada = barbearia_repo.obter_por_id(id)
    return BarbeariaAdminResponse.de_barbearia(atualizada)
