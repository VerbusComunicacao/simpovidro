import database from "infra/database.js"
import { translateText } from "lib/registration-helpers.js"

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
      "AÉREO CARRO": "",
      Diretoria: "",
      Associado: "",
      "Entidade Regional": "",
      Apoiador: "",
      Usinas: "",
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
      COALESCE(c.corporate_name, 'Sem Empresa') as "Nome da empresa",
      COALESCE(c.cnpj, 'N/A') as "CNPJ",
      COALESCE(c.state, 'N/A') as "Estado",
      CASE 
        WHEN c.id IS NULL THEN 'Não associada'
        WHEN d.name ILIKE 'Associada' OR d.name ILIKE 'Associado' OR d.name ILIKE '%abravidro%' OR COALESCE(c.custom_discount_percentage, d.value, 0) = 20.00 THEN 'Associada Abravidro (20% desconto)'
        WHEN d.name ILIKE '%regional%' OR COALESCE(c.custom_discount_percentage, d.value, 0) = 15.00 THEN 'Associada Regional (15% de desconto)'
        ELSE 'Não associada'
      END as "Tipo de Associação",
      COUNT(DISTINCT g.id) as "Total de participantes",
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
    LEFT JOIN discounts d ON c.discount_id = d.id
    WHERE s.status != 'cancelled' AND h.id = $1
    GROUP BY c.id, c.corporate_name, c.cnpj, c.state, c.custom_discount_percentage, d.id, d.name, d.value
    ORDER BY "Total de participantes" DESC
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
        EXTRACT(YEAR FROM AGE(COALESCE(h.check_in_date, NOW()), g.birth_date)) as age,
        CASE 
          WHEN EXTRACT(YEAR FROM AGE(COALESCE(h.check_in_date, NOW()), g.birth_date)) < 18 THEN 'Menor de 18'
          WHEN EXTRACT(YEAR FROM AGE(COALESCE(h.check_in_date, NOW()), g.birth_date)) BETWEEN 18 AND 25 THEN '18-25'
          WHEN EXTRACT(YEAR FROM AGE(COALESCE(h.check_in_date, NOW()), g.birth_date)) BETWEEN 26 AND 35 THEN '26-35'
          WHEN EXTRACT(YEAR FROM AGE(COALESCE(h.check_in_date, NOW()), g.birth_date)) BETWEEN 36 AND 50 THEN '36-50'
          WHEN EXTRACT(YEAR FROM AGE(COALESCE(h.check_in_date, NOW()), g.birth_date)) > 50 THEN '51+'
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

  // Calculate the custom summary
  const policiesResult = await database.query({
    text: `
      SELECT max_age, description 
      FROM price_policies 
      WHERE hotel_id = $1 
      ORDER BY max_age ASC
    `,
    values: [hotelId],
  })
  const policies = policiesResult.rows

  const guestsResult = await database.query({
    text: `
      SELECT 
        g.gender,
        g.birth_date,
        CASE 
          WHEN g.birth_date IS NULL THEN NULL
          ELSE EXTRACT(YEAR FROM AGE(COALESCE(h.check_in_date, NOW()), g.birth_date))
        END as age
      FROM guests g
      JOIN sales_guests sg ON g.id = sg.guest_id
      JOIN sales s ON sg.sale_id = s.id
      JOIN rooms r ON s.room_id = r.id
      JOIN hotels h ON r.hotel_id = h.id
      WHERE s.status != 'cancelled' AND h.id = $1
    `,
    values: [hotelId],
  })
  const guests = guestsResult.rows

  let menCount = 0
  let womenCount = 0
  let totalCount = 0
  let adultCount = 0

  const childCounts = {}
  policies.forEach((p) => {
    const desc = translateText(p.description, false)
    childCounts[desc] = 0
  })

  guests.forEach((g) => {
    totalCount++

    // Gender
    const gender = g.gender ? g.gender.trim().toLowerCase() : ""
    if (gender === "masculino" || gender === "m" || gender === "male") {
      menCount++
    } else if (gender === "feminino" || gender === "f" || gender === "female") {
      womenCount++
    }

    // Age / Adult vs Child
    if (g.birth_date === null) {
      adultCount++
    } else {
      const age = parseInt(g.age)
      if (age >= 12) {
        adultCount++
      } else {
        const matchingPolicy = policies.find((p) => age <= p.max_age)
        if (matchingPolicy) {
          const desc = translateText(matchingPolicy.description, false)
          childCounts[desc] = (childCounts[desc] || 0) + 1
        } else {
          if (policies.length > 0) {
            const lastPolicy = policies[policies.length - 1]
            const desc = translateText(lastPolicy.description, false)
            childCounts[desc] = (childCounts[desc] || 0) + 1
          } else {
            childCounts["Crianças"] = (childCounts["Crianças"] || 0) + 1
          }
        }
      }
    }
  })

  const summary = [
    { Descrição: "Homens", Quantidade: menCount },
    { Descrição: "Mulheres", Quantidade: womenCount },
    { Descrição: "Total", Quantidade: totalCount },
    { Descrição: "Adultos", Quantidade: adultCount },
  ]

  Object.entries(childCounts).forEach(([desc, count]) => {
    summary.push({
      Descrição: desc,
      Quantidade: count,
    })
  })

  return {
    ranges: result.rows,
    summary,
  }
}

async function generateByCountry(hotelId) {
  if (!hotelId) {
    throw new Error("Hotel ID é obrigatório para gerar relatórios.")
  }

  const query = `
    SELECT 
      COALESCE(g.country, 'Não Informado') as "País",
      COUNT(DISTINCT g.id) as "Total de participantes",
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
    ORDER BY "Total de participantes" DESC
  `

  const result = await database.query({
    text: query,
    values: [hotelId],
  })
  return result.rows
}

const stateMap = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
}

function getFullStateName(stateStr) {
  if (!stateStr || stateStr.trim() === "") {
    return "Não Informado"
  }
  const clean = stateStr
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  if (stateMap[clean]) {
    return stateMap[clean]
  }

  const foundEntry = Object.entries(stateMap).find(([key, val]) => {
    const normVal = val
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
    return normVal === clean
  })

  if (foundEntry) {
    return foundEntry[1]
  }

  return "Não Informado"
}

async function generateByUF(hotelId) {
  if (!hotelId) {
    throw new Error("Hotel ID é obrigatório para gerar relatórios.")
  }

  const query = `
    SELECT 
      COALESCE(c.state, '') as raw_state,
      g.name,
      g.email,
      g.phone,
      COALESCE(c.city, g.city, '') as city
    FROM guests g
    JOIN sales_guests sg ON g.id = sg.guest_id
    JOIN sales s ON sg.sale_id = s.id
    JOIN rooms r ON s.room_id = r.id
    JOIN hotels h ON r.hotel_id = h.id
    LEFT JOIN companies c ON s.company_id = c.id
    WHERE s.status != 'cancelled' AND h.id = $1
  `

  const result = await database.query({
    text: query,
    values: [hotelId],
  })

  const stateGroups = {}

  result.rows.forEach((row) => {
    const fullState = getFullStateName(row.raw_state)
    if (!stateGroups[fullState]) {
      stateGroups[fullState] = {
        state: fullState,
        total_participants: 0,
        participants: [],
      }
    }

    stateGroups[fullState].total_participants++
    stateGroups[fullState].participants.push({
      name: row.name,
      email: row.email,
      phone: row.phone,
      city: row.city,
    })
  })

  // Sort participants inside each state
  Object.values(stateGroups).forEach((group) => {
    group.participants.sort((a, b) => a.name.localeCompare(b.name))
  })

  // Return sorted states by total_participants DESC
  return Object.values(stateGroups).sort(
    (a, b) => b.total_participants - a.total_participants,
  )
}

async function generateCompaniesByActivityReport(hotelId) {
  if (!hotelId) {
    throw new Error("Hotel ID é obrigatório para gerar relatórios.")
  }

  const query = `
    WITH unique_companies AS (
      SELECT DISTINCT ON (c.id)
        c.id,
        COALESCE(NULLIF(TRIM(c.activity_sector), ''), 'Não Informado') as activity_sector,
        c.corporate_name as name,
        COALESCE(c.cnpj, 'N/A') as cnpj,
        COALESCE(c.state, 'N/A') as state,
        COALESCE(c.city, 'N/A') as city
      FROM sales s
      JOIN rooms r ON s.room_id = r.id
      JOIN hotels h ON r.hotel_id = h.id
      JOIN companies c ON s.company_id = c.id
      WHERE s.status != 'cancelled' AND h.id = $1
    )
    SELECT 
      activity_sector,
      COUNT(id)::int as total_companies,
      json_agg(
        json_build_object(
          'name', name,
          'cnpj', cnpj,
          'state', state,
          'city', city
        ) ORDER BY name
      ) as companies
    FROM unique_companies
    GROUP BY activity_sector
    ORDER BY total_companies DESC
  `

  const result = await database.query({
    text: query,
    values: [hotelId],
  })
  return result.rows
}

async function generateByAccommodationReport(hotelId) {
  if (!hotelId) {
    throw new Error("Hotel ID é obrigatório para gerar relatórios.")
  }

  const query = `
    SELECT 
      s.id as sale_id,
      s.final_amount,
      rt.name as room_type_name,
      rc.name as room_category_name,
      json_agg(g.id) as guest_ids
    FROM sales s
    JOIN rooms r ON s.room_id = r.id
    JOIN "room-categories" rc ON r.room_category_id = rc.id
    JOIN "room-types" rt ON r.room_type_id = rt.id
    JOIN hotels h ON r.hotel_id = h.id
    JOIN sales_guests sg ON s.id = sg.sale_id
    JOIN guests g ON sg.guest_id = g.id
    WHERE s.status != 'cancelled' AND h.id = $1
    GROUP BY s.id, s.final_amount, rt.name, rc.name
  `

  const result = await database.query({
    text: query,
    values: [hotelId],
  })

  const groups = {}

  result.rows.forEach((row) => {
    const accommodationLabel = row.room_type_name ? row.room_type_name.trim().toUpperCase() : "INDIVIDUAL"
    const categoryLabel = row.room_category_name ? row.room_category_name.trim().toUpperCase() : "STANDARD"

    const groupKey = `${accommodationLabel}||${categoryLabel}`

    if (!groups[groupKey]) {
      groups[groupKey] = {
        accommodation: accommodationLabel,
        category: categoryLabel,
        apartment_count: 0,
        pax_count: 0,
        total_value: 0,
      }
    }

    groups[groupKey].apartment_count++
    groups[groupKey].pax_count += (row.guest_ids ? row.guest_ids.length : 0)
    groups[groupKey].total_value += parseFloat(row.final_amount || 0)
  })

  return Object.values(groups).sort((a, b) => {
    const catCompare = a.category.localeCompare(b.category)
    if (catCompare !== 0) return catCompare
    return a.accommodation.localeCompare(b.accommodation)
  })
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

async function generateCompaniesDiscountReport(hotelId) {
  if (!hotelId) {
    throw new Error("Hotel ID é obrigatório para gerar relatórios.")
  }

  const query = `
    SELECT
      c.cnpj,
      c.corporate_name,
      COALESCE(c.custom_discount_percentage, d.value, 0) as discount_percentage
    FROM companies c
    LEFT JOIN discounts d ON c.discount_id = d.id
    WHERE COALESCE(c.custom_discount_percentage, d.value, 0) > 0
    ORDER BY c.corporate_name ASC
  `

  const result = await database.query({
    text: query,
  })

  return result.rows.map((row) => {
    return {
      CNPJ: formatCNPJ(row.cnpj),
      "Razão Social": row.corporate_name,
      Desconto: row.discount_percentage
        ? parseFloat(row.discount_percentage)
        : 0,
    }
  })
}

const report = {
  generateCompleteReport,
  generateByCompany,
  generateByAge,
  generateByCountry,
  generateByUF,
  generateCompaniesByActivityReport,
  generateByAccommodationReport,
  generateCheckoutQuestionsReport,
  generateCompaniesDiscountReport,
}

export default report
