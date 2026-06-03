"""Rotas administrativas para gerenciamento de Serviços."""

# =============================================================================
# Imports
# =============================================================================
from typing import Optional

from fastapi import APIRouter, Form, Request
from fastapi import status as http_status
from fastapi.responses import RedirectResponse
from pydantic import ValidationError

from dtos.servico_dto import CriarServicoDTO, AlterarServicoDTO
from model.servico_model import Servico
from model.usuario_logado_model import UsuarioLogado
from repo import servico_repo
from util.auth_decorator import requer_autenticacao
from util.exceptions import ErroValidacaoFormulario
from util.flash_messages import informar_sucesso, informar_erro
from util.logger_config import logger
from util.perfis import Perfil
from util.rate_limiter import DynamicRateLimiter, obter_identificador_cliente
from util.repository_helpers import obter_ou_404
from util.template_util import criar_templates

# =============================================================================
# Configuração do Router
# =============================================================================
router = APIRouter(prefix="/admin/servicos")
templates = criar_templates()

# =============================================================================
# Rate Limiter
# =============================================================================
servico_limiter = DynamicRateLimiter(
    chave_max="rate_limit_admin_servico_max",
    chave_minutos="rate_limit_admin_servico_minutos",
    padrao_max=30,
    padrao_minutos=1,
    nome="admin_servico",
)


@router.get("/listar")
@requer_autenticacao([Perfil.ADMIN.value])
async def listar(request: Request, usuario_logado: Optional[UsuarioLogado] = None):
    """Lista todos os serviços."""
    assert usuario_logado is not None
    itens = servico_repo.obter_todos()
    return templates.TemplateResponse(
        "admin/servicos/listar.html",
        {"request": request, "servicos": itens, "usuario_logado": usuario_logado},
    )


@router.get("/cadastrar")
@requer_autenticacao([Perfil.ADMIN.value])
async def get_cadastrar(request: Request, usuario_logado: Optional[UsuarioLogado] = None):
    """Exibe formulário de cadastro."""
    assert usuario_logado is not None
    return templates.TemplateResponse(
        "admin/servicos/cadastrar.html",
        {"request": request, "usuario_logado": usuario_logado},
    )


@router.post("/cadastrar")
@requer_autenticacao([Perfil.ADMIN.value])
async def post_cadastrar(
    request: Request,
    nome: str = Form(...),
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Cadastra um novo serviço."""
    assert usuario_logado is not None

    ip = obter_identificador_cliente(request)
    if not servico_limiter.verificar(ip):
        informar_erro(request, "Muitas operações. Aguarde um momento.")
        return RedirectResponse("/admin/servicos/listar", status_code=http_status.HTTP_303_SEE_OTHER)

    dados_formulario: dict = {"nome": nome}

    try:
        dto = CriarServicoDTO(nome=nome)
        novo = Servico(id=0, nome=dto.nome)
        id_criado = servico_repo.inserir(novo)
        if id_criado:
            informar_sucesso(request, "Serviço cadastrado com sucesso!")
            logger.info(f"Serviço #{id_criado} criado por admin {usuario_logado.id}")
        else:
            informar_erro(request, "Erro ao cadastrar serviço.")
    except ValidationError as e:
        raise ErroValidacaoFormulario(
            validation_error=e,
            template_path="admin/servicos/cadastrar.html",
            dados_formulario=dados_formulario,
        )

    return RedirectResponse("/admin/servicos/listar", status_code=http_status.HTTP_303_SEE_OTHER)


@router.get("/editar/{id}")
@requer_autenticacao([Perfil.ADMIN.value])
async def get_editar(request: Request, id: int, usuario_logado: Optional[UsuarioLogado] = None):
    """Exibe formulário de edição."""
    assert usuario_logado is not None

    item = obter_ou_404(
        servico_repo.obter_por_id(id),
        request,
        "Serviço não encontrado",
        "/admin/servicos/listar",
    )
    if isinstance(item, RedirectResponse):
        return item

    dados = item.__dict__.copy()
    return templates.TemplateResponse(
        "admin/servicos/editar.html",
        {
            "request": request,
            "servico": item,
            "dados": dados,
            "usuario_logado": usuario_logado,
        },
    )


@router.post("/editar/{id}")
@requer_autenticacao([Perfil.ADMIN.value])
async def post_editar(
    request: Request,
    id: int,
    nome: str = Form(...),
    usuario_logado: Optional[UsuarioLogado] = None,
):
    """Altera um serviço."""
    assert usuario_logado is not None

    ip = obter_identificador_cliente(request)
    if not servico_limiter.verificar(ip):
        informar_erro(request, "Muitas operações. Aguarde um momento.")
        return RedirectResponse("/admin/servicos/listar", status_code=http_status.HTTP_303_SEE_OTHER)

    item = obter_ou_404(
        servico_repo.obter_por_id(id),
        request,
        "Serviço não encontrado",
        "/admin/servicos/listar",
    )
    if isinstance(item, RedirectResponse):
        return item

    dados_formulario: dict = {"id": id, "nome": nome}

    try:
        dto = AlterarServicoDTO(nome=nome)
        atualizado = Servico(id=id, nome=dto.nome)
        if servico_repo.atualizar(atualizado):
            informar_sucesso(request, "Serviço atualizado com sucesso!")
            logger.info(f"Serviço #{id} alterado por admin {usuario_logado.id}")
        else:
            informar_erro(request, "Erro ao atualizar serviço.")
    except ValidationError as e:
        dados_formulario["servico"] = item
        raise ErroValidacaoFormulario(
            validation_error=e,
            template_path="admin/servicos/editar.html",
            dados_formulario=dados_formulario,
        )

    return RedirectResponse("/admin/servicos/listar", status_code=http_status.HTTP_303_SEE_OTHER)


@router.post("/excluir/{id}")
@requer_autenticacao([Perfil.ADMIN.value])
async def post_excluir(request: Request, id: int, usuario_logado: Optional[UsuarioLogado] = None):
    """Exclui um serviço."""
    assert usuario_logado is not None

    if servico_repo.excluir(id):
        informar_sucesso(request, "Serviço excluído com sucesso!")
        logger.info(f"Serviço #{id} excluído por admin {usuario_logado.id}")
    else:
        informar_erro(request, "Erro ao excluir serviço.")

    return RedirectResponse("/admin/servicos/listar", status_code=http_status.HTTP_303_SEE_OTHER)
