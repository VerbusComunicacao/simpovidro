import database from "infra/database.js"

async function generateCompleteReport(hotelId) {
  if (!hotelId) {
    throw new Error("Hotel ID é obrigatório para gerar relatórios.")
  }

  const query = `
    SELECT 
      g.name as "Nome",
      g.badge_name as "Crachá do Participante",
      g.email as "Email",
      g.phone as "Celular",
      g.gender as "Sexo",
      g.birth_date as "Data de Nascimento",
      g.cpf_number as "CPF",
      g.rg_number as "RG",
      g.passport_number as "Passaporte",
      g.nationality as "Nacionalidade",
      c.corporate_name as "Empresa",
      c.cnpj as "CNPJ da empresa",
      c.badge as "Nome da empresa no crachá",
      c.phone as "Telefone Comercial",
      c.address as "Endereço da Empresa",
      c.address_number as "Número",
      c.neighborhood as "Bairro",
      c.city as "Cidade",
      c.state as "Estado",
      c.zip_code as "CEP",
      g.medication_details as "Medicação",
      g.blood_type as "Tipo sanguíneo",
      g.blood_rh_factor as "Fator RH",
      g.health_observations as "Observações de saúde",
      g.special_needs_details as "Detalhes de necessidades especiais",
      g.has_heart_condition as "Condição cardíaca",
      g.has_diabetes as "Diabetes",
      g.has_high_blood_pressure as "Pressão alta",
      g.has_low_blood_pressure as "Pressão baixa",
      g.emergency_contact_name as "Contato de emergência",
      g.emergency_contact_phone as "Telefone de emergência",
      s.sale_number as "Número da venda",
      s.payment_status as "Status de pagamento",
      s.final_amount as "Valor total",
      r.name as "Nome do quarto",
      s.bed_preference as "Preferência de Cama",
      TO_CHAR(s.created_at, 'DD/MM/YYYY') as "Data de Registro"
    FROM guests g
    JOIN sales_guests sg ON g.id = sg.guest_id
    JOIN sales s ON sg.sale_id = s.id
    JOIN rooms r ON s.room_id = r.id
    JOIN hotels h ON r.hotel_id = h.id
    LEFT JOIN companies c ON g.company_cnpj = c.cnpj
    WHERE s.status != 'cancelled' AND h.id = $1
    ORDER BY g.name
  `

  const result = await database.query({
    text: query,
    values: [hotelId],
  })
  return result.rows
}

async function generateByCompany(hotelId) {
  if (!hotelId) {
    throw new Error("Hotel ID é obrigatório para gerar relatórios.")
  }

  const query = `
    SELECT 
      COALESCE(c.corporate_name, 'Sem Empresa') as company_name,
      COALESCE(g.company_cnpj, 'N/A') as cnpj,
      COALESCE(c.state, 'N/A') as state,
      COUNT(DISTINCT g.id) as total_participants,
      json_agg(
        json_build_object(
          'name', g.name,
          'email', g.email,
          'phone', g.phone,
          'hotel', h.name
        ) ORDER BY g.name
      ) as participants
    FROM guests g
    JOIN sales_guests sg ON g.id = sg.guest_id
    JOIN sales s ON sg.sale_id = s.id
    JOIN rooms r ON s.room_id = r.id
    JOIN hotels h ON r.hotel_id = h.id
    LEFT JOIN companies c ON g.company_cnpj = c.cnpj
    WHERE s.status != 'cancelled' AND h.id = $1
    GROUP BY c.corporate_name, g.company_cnpj, c.state
    ORDER BY total_participants DESC
  `

  const result = await database.query({
    text: query,
    values: [hotelId],
  })
  return result.rows
}

async function generateByAge(hotelId) {
  if (!hotelId) {
    throw new Error("Hotel ID é obrigatório para gerar relatórios.")
  }

  const query = `
    WITH age_calculations AS (
      SELECT 
        g.name,
        g.email,
        g.phone,
        g.gender,
        g.birth_date,
        EXTRACT(YEAR FROM AGE(g.birth_date)) as age,
        CASE 
          WHEN EXTRACT(YEAR FROM AGE(g.birth_date)) < 18 THEN 'Menor de 18'
          WHEN EXTRACT(YEAR FROM AGE(g.birth_date)) BETWEEN 18 AND 25 THEN '18-25'
          WHEN EXTRACT(YEAR FROM AGE(g.birth_date)) BETWEEN 26 AND 35 THEN '26-35'
          WHEN EXTRACT(YEAR FROM AGE(g.birth_date)) BETWEEN 36 AND 50 THEN '36-50'
          WHEN EXTRACT(YEAR FROM AGE(g.birth_date)) > 50 THEN '51+'
          ELSE 'Idade não informada'
        END as age_range
      FROM guests g
      JOIN sales_guests sg ON g.id = sg.guest_id
      JOIN sales s ON sg.sale_id = s.id
      JOIN rooms r ON s.room_id = r.id
      JOIN hotels h ON r.hotel_id = h.id
      WHERE s.status != 'cancelled' AND g.birth_date IS NOT NULL AND h.id = $1
    )
    SELECT 
      age_range,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE gender ILIKE 'masculino' OR gender ILIKE 'male' OR gender ILIKE 'm') as male_count,
      COUNT(*) FILTER (WHERE gender ILIKE 'feminino' OR gender ILIKE 'female' OR gender ILIKE 'f') as female_count,
      json_agg(
        json_build_object(
          'name', name,
          'age', age,
          'email', email,
          'phone', phone,
          'sexo', gender
        ) ORDER BY name
      ) as participants
    FROM age_calculations
    GROUP BY age_range
    ORDER BY 
      CASE age_range
        WHEN 'Menor de 18' THEN 1
        WHEN '18-25' THEN 2
        WHEN '26-35' THEN 3
        WHEN '36-50' THEN 4
        WHEN '51+' THEN 5
        ELSE 6
      END
  `

  const result = await database.query({
    text: query,
    values: [hotelId],
  })
  return result.rows
}

async function generateByCountry(hotelId) {
  if (!hotelId) {
    throw new Error("Hotel ID é obrigatório para gerar relatórios.")
  }

  const query = `
    SELECT 
      COALESCE(g.country, 'Não Informado') as country,
      COUNT(DISTINCT g.id) as total_participants,
      json_agg(
        json_build_object(
          'name', g.name,
          'email', g.email,
          'phone', g.phone,
          'city', g.city,
          'state', g.state
        ) ORDER BY g.name
      ) as participants
    FROM guests g
    JOIN sales_guests sg ON g.id = sg.guest_id
    JOIN sales s ON sg.sale_id = s.id
    JOIN rooms r ON s.room_id = r.id
    JOIN hotels h ON r.hotel_id = h.id
    WHERE s.status != 'cancelled' AND h.id = $1
    GROUP BY g.country
    ORDER BY total_participants DESC
  `

  const result = await database.query({
    text: query,
    values: [hotelId],
  })
  return result.rows
}

async function generateByUF(hotelId) {
  if (!hotelId) {
    throw new Error("Hotel ID é obrigatório para gerar relatórios.")
  }

  const query = `
    SELECT 
      COALESCE(g.state, 'N/A') as state,
      COUNT(DISTINCT g.id) as total_participants,
      json_agg(
        json_build_object(
          'name', g.name,
          'email', g.email,
          'phone', g.phone,
          'city', g.city
        ) ORDER BY g.name
      ) as participants
    FROM guests g
    JOIN sales_guests sg ON g.id = sg.guest_id
    JOIN sales s ON sg.sale_id = s.id
    JOIN rooms r ON s.room_id = r.id
    JOIN hotels h ON r.hotel_id = h.id
    WHERE s.status != 'cancelled' AND h.id = $1
    GROUP BY g.state
    ORDER BY total_participants DESC
  `

  const result = await database.query({
    text: query,
    values: [hotelId],
  })
  return result.rows
}

const report = {
  generateCompleteReport,
  generateByCompany,
  generateByAge,
  generateByCountry,
  generateByUF,
}

export default report
