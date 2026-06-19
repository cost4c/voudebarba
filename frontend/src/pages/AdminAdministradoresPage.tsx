// AdminAdministradoresPage — lista de administradores (perfil Administrador).
// Permite criar novos admins e editar/excluir (sem auto-exclusão).

import ListaUsuariosAdmin from '../components/admin/ListaUsuariosAdmin'
import { Perfil } from '../lib/types'

export default function AdminAdministradoresPage() {
  return (
    <ListaUsuariosAdmin
      perfil={Perfil.ADMIN}
      titulo="Administradores"
      descricao="administrador(es)"
      permitirCriar
      textoCriar="+ Novo administrador"
    />
  )
}
