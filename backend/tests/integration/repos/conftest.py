"""
Configuracao especifica para testes de repositorios.

Fornece fixtures reutilizaveis para testes de repos.
A criacao de tabelas e feita pela fixture criar_tabelas_integracao
no conftest.py do nivel de integracao.
"""
import pytest

from repo import usuario_repo
from model.usuario_model import Usuario
from util.security import criar_hash_senha
from util.perfis import Perfil


# ============================================================================
# FIXTURES REUTILIZAVEIS PARA TESTES DE REPOS
# ============================================================================


@pytest.fixture(scope="function")
def usuario_repo_teste():
    """
    Cria um usuario para associar a entidades que requerem FK de usuario.

    Returns:
        int: ID do usuario criado
    """
    usuario = Usuario(
        id=0,
        nome="Usuario Repo Teste",
        email="usuario_repo@example.com",
        senha=criar_hash_senha("Senha@123"),
        perfil=Perfil.CLIENTE.value
    )
    usuario_id = usuario_repo.inserir(usuario)
    return usuario_id


@pytest.fixture(scope="function")
def admin_repo_teste():
    """
    Cria um usuario admin para testes que requerem perfil administrativo.

    Returns:
        int: ID do admin criado
    """
    usuario = Usuario(
        id=0,
        nome="Admin Repo Teste",
        email="admin_repo@example.com",
        senha=criar_hash_senha("Senha@123"),
        perfil=Perfil.ADMIN.value
    )
    usuario_id = usuario_repo.inserir(usuario)
    return usuario_id
