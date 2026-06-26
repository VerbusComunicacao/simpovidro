import database from "infra/database.js"

function formatCNPJ(cnpj) {
  if (!cnpj) return null
  const cleaned = cnpj.replace(/\D/g, "")
  if (cleaned.length !== 14) return cnpj
  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  )
}

function formatGender(gender) {
  if (!gender) return ""
  const g = gender.trim().toLowerCase()
  if (g === "f" || g === "female" || g === "feminino") return "FEMININO"
  if (g === "m" || g === "male" || g === "masculino") return "MASCULINO"
  return gender.toUpperCase()
}

function formatPaymentStatus(status) {
  if (!status) return ""
  const s = status.trim().toLowerCase()
  switch (s) {
    case "paid":
    case "confirmed":
      return "Pago"
    case "pending":
      return "Pendente"
    case "partial":
      return "Parcial"
    case "refunded":
      return "Reembolsado"
    default:
      return status
  }
}

async function generateCompleteReport(hotelId) {
  if (!hotelId) {
    throw new Error("Hotel ID é obrigatório para gerar relatórios.")
  }

  const query = `
    SELECT 
      TO_CHAR(s.created_at, 'DD/MM/YYYY') as data_registro,
      r.name as nome_quarto,
      s.bed_preference as tipo_acomodacao,
      s.sale_number as numero_venda,
      c.corporate_name as empresa,
      g.name as nome,
      g.cpf_number as cpf,
      g.rg_number as rg,
      g.email,
      TO_CHAR(g.birth_date, 'DD/MM/YYYY') as data_nascimento,
      c.phone as telefone_comercial,
      g.gender as sexo,
      c.address as endereco_empresa,
      c.address_number as numero,
      c.address_complement as complemento,
      c.zip_code as cep,
      c.neighborhood as bairro,
      c.city as cidade,
      c.country as pais,
      g.nationality as nacionalidade,
      s.notes as observacoes,
      UPPER(g.badge_name) as cracha_participante,
      g.phone as celular,
      g.passport_number as passaporte,
      c.cnpj as cnpj_empresa,
      UPPER(c.badge) as nome_empresa_cracha,
      c.state as estado,
      g.medication_details as medicacao,
      g.blood_type as tipo_sanguineo,
      g.blood_rh_factor as fator_rh,
      g.health_observations as observacoes_saude,
      g.special_needs_details as necessidades_especiais,
      g.has_heart_condition as condicao_cardiaca,
      g.has_diabetes as diabetes,
      g.has_high_blood_pressure as pressao_alta,
      g.has_low_blood_pressure as pressao_baixa,
      g.emergency_contact_name as contato_emergencia,
      g.emergency_contact_phone as telefone_emergencia,
      s.payment_status as status_pagamento,
      s.final_amount as valor_total,
      c.activity_sector as area_atuacao
    FROM guests g
    JOIN sales_guests sg ON g.id = sg.guest_id
    JOIN sales s ON sg.sale_id = s.id
    JOIN rooms r ON s.room_id = r.id
    JOIN hotels h ON r.hotel_id = h.id
    LEFT JOIN companies c ON s.company_id = c.id
    WHERE s.status != 'cancelled' AND h.id = $1
    ORDER BY s.created_at ASC, s.sale_number ASC
  `

  const result = await database.query({
    text: query,
    values: [hotelId],
  })

  return result.rows.map((row) => {
    return {
      "Data de Registro": row.data_registro || "",
      "Nome do quarto": row.nome_quarto || "",
      "Tipo de acomodação": row.tipo_acomodacao || "",
      "Número da venda": row.numero_venda || "",
      Empresa: row.empresa || "",
      Nome: row.nome || "",
      "CHECK-IN": "",
      "CHECK-OUT": "",
      Passaporte: row.passaporte || null,
      CPF: row.cpf || null,
      RG: row.rg || null,
      Email: row.email || "",
      "Data de Nascimento": row.data_nascimento || "",
      "Telefone Comercial": row.telefone_comercial || "",
      PROFISSÃO: "",
      Sexo: formatGender(row.sexo),
      "Endereço da Empresa": row.endereco_empresa || "",
      Número: row.numero || "",
      Complemento: row.complemento || "",
      CEP: row.cep || "",
      Bairro: row.bairro || "",
      Cidade: row.cidade || "",
      PAÍS: row.pais || "",
      Nacionalidade: row.nacionalidade || "",
      OBSERVAÇÕES: row.observacoes || "",
      "Crachá do Participante": row.cracha_participante || "",
      Celular: row.celular || "",
      "CNPJ da empresa": formatCNPJ(row.cnpj_empresa),
      "Nome da empresa no crachá": row.nome_empresa_cracha || "",
      Estado: row.estado || "",
      Medicação: row.medicacao || "",
      "Tipo sanguíneo": row.tipo_sanguineo || "",
      "Fator RH": row.fator_rh || "",
      "Observações de saúde": row.observacoes_saude || "",
      "Detalhes de necessidades especiais": row.necessidades_especiais || "",
      "Condição cardíaca": row.condicao_cardiaca,
      Diabetes: row.diabetes,
      "Pressão alta": row.pressao_alta,
      "Pressão baixa": row.pressao_baixa,
      "Contato de emergência": row.contato_emergencia || "",
      "Telefone de emergência": row.telefone_emergencia || "",
      "Status de pagamento": formatPaymentStatus(row.status_pagamento),
      "Valor total": row.valor_total ? parseFloat(row.valor_total) : "",
      "Área de atuação": row.area_atuacao || "",
    }
  })
}

async function generateByCompany(hotelId) {
  if (!hotelId) {
    throw new Error("Hotel ID é obrigatório para gerar relatórios.")
  }

  const query = `
    SELECT 
      COALESCE(c.corporate_name, 'Sem Empresa') as company_name,
      COALESCE(c.cnpj, 'N/A') as cnpj,
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
    LEFT JOIN companies c ON s.company_id = c.id
    WHERE s.status != 'cancelled' AND h.id = $1
    GROUP BY c.id, c.corporate_name, c.cnpj, c.state
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

async function generateCheckoutQuestionsReport(hotelId) {
  if (!hotelId) {
    throw new Error("Hotel ID é obrigatório para gerar relatórios.")
  }

  const query = `
    SELECT 
      s.sale_number as "Número da Inscrição",
      g.name as "Titular da Inscrição",
      h.name as "Hotel",
      h.checkout_question as "Pergunta",
      COALESCE(s.checkout_question_response, 'Não respondido') as "Resposta",
      TO_CHAR(s.created_at, 'DD/MM/YYYY') as "Data da Inscrição"
    FROM sales s
    JOIN guests g ON s.guest_id = g.id
    JOIN rooms r ON s.room_id = r.id
    JOIN hotels h ON r.hotel_id = h.id
    WHERE s.status != 'cancelled' AND h.id = $1
    ORDER BY s.sale_number ASC
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
  generateCheckoutQuestionsReport,
}

export default report
