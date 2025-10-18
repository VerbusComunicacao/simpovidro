import useSWR from "swr"

async function fetchAPI(key) {
  const response = await fetch(key)
  const responseBody = await response.json()
  return responseBody
}

export default function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <UpdatadAt />
      <DatabaseStatus />
    </>
  )
}

function DatabaseStatus() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI)

  let database = "Carregando..."

  if (!isLoading && data) {
    database = data.dependencies.database
  }

  return (
    <div>
      <h2>Database</h2>
      <p>Versão do banco de dados: {database.version}</p>
      <p>Conexões máximas: {database.max_connections}</p>
      <p>Conexões abertas: {database.opened_connections}</p>
    </div>
  )
}

function UpdatadAt() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  })

  let updatedAt = "Carregando..."

  if (!isLoading && data) {
    updatedAt = data.updated_at
  }

  return (
    <div>
      <p>Última atualização: {updatedAt}</p>
    </div>
  )
}
