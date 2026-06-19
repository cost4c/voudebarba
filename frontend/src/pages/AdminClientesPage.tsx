// AdminClientesPage — lista de clientes (perfil Administrador).
// Sem criação (clientes se auto-cadastram); admin pode editar/excluir.

import ListaUsuariosAdmin from '../components/admin/ListaUsuariosAdmin'
import { Perfil } from '../lib/types'

export default function AdminClientesPage() {
  return (
    <ListaUsuariosAdmin
      perfil={Perfil.CLIENTE}
      titulo="Clientes"
      descricao="cliente(s)"
    />
  )
}
