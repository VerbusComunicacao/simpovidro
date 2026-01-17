import database from "infra/database.js"
import { ValidationError, NotFoundError } from "infra/errors.js"
import { validateRequiredFields, validateUUID } from "infra/validator.js"

const REQUIRED_FIELDS = ["guest_id", "room_id"]

async function create(saleInputValues) {
  validateRequiredFields(saleInputValues, ["guest_ids", "room_id"])

  const { guest_ids, room_id } = saleInputValues

  if (!Array.isArray(guest_ids) || guest_ids.length === 0) {
    throw new ValidationError({
      message: "A lista de hóspedes não pode estar vazia.",
      action: "Adicione pelo menos um hóspede.",
    })
  }

  const client = await database.getNewClient()

  try {
    await client.query("BEGIN")

    // 1. Validate if room exists and fetch hotel_id, capacity and policies
    const roomResults = await client.query({
      text: `
        SELECT 
          r.*,
          h.check_in_date as hotel_check_in_date,
          h.check_out_date as hotel_check_out_date,
          h.associated_company_discount_percentage as hotel_associated_discount_percentage,
          rc.max_adults,
          rc.max_children,
          COALESCE(
            (
              SELECT json_agg(pp.* ORDER BY pp.max_age ASC)
              FROM "price_policies" pp
              WHERE pp.hotel_id = r.hotel_id
            ),
            '[]'::json
          ) as price_policies
        FROM 
          "rooms" r
        JOIN 
          "hotels" h ON r.hotel_id = h.id
        JOIN
          "room-categories" rc ON r.room_category_id = rc.id
        WHERE 
          r.id = $1
        LIMIT 1
        FOR UPDATE OF r;`,
      values: [room_id],
    })

    const targetRoom = roomResults.rows[0]

    if (!targetRoom) {
      throw new NotFoundError({
        message: "Quarto não encontrado.",
        action: "Selecione outro quarto.",
      })
    }

    // 2. Check room availability
    if (targetRoom.available_rooms <= 0) {
      throw new ValidationError({
        message: "Este quarto não está mais disponível.",
        action: "Selecione outro quarto.",
      })
    }

    // 3. Fetch Guest Data (needed for both capacity and pricing)
    const guests = await client.query({
      text: `SELECT id, birth_date FROM guests WHERE id = ANY($1)`,
      values: [guest_ids],
    })

    if (guests.rowCount !== guest_ids.length) {
      throw new NotFoundError({
        message: "Um ou mais hóspedes informados não foram encontrados.",
        action: "Verifique os dados dos hóspedes.",
      })
    }

    // 3.5 Check for overlapping registrations for these guests in this hotel
    const overlapResults = await client.query({
      text: `
            SELECT 
                g.name
            FROM 
                sales_guests sg
            JOIN 
                sales s ON sg.sale_id = s.id
            JOIN 
                rooms r ON s.room_id = r.id
            JOIN
                guests g ON sg.guest_id = g.id
            WHERE 
                sg.guest_id = ANY($1) 
                AND r.hotel_id = $2
            LIMIT 1;`,
      values: [guest_ids, targetRoom.hotel_id],
    })

    if (overlapResults.rowCount > 0) {
      throw new ValidationError({
        message: `O hóspede ${overlapResults.rows[0].name} já possui uma inscrição para este hotel neste período.`,
        action:
          "Verifique os dados da inscrição ou entre em contato com o suporte.",
      })
    }

    // 4. Check room capacity (Adults vs Children)
    const referenceDate = new Date(targetRoom.hotel_check_in_date || new Date())
    let adultCount = 0
    let childCount = 0

    const guestAges = guests.rows.map((guest) => {
      const birth = new Date(guest.birth_date)
      let age = referenceDate.getUTCFullYear() - birth.getUTCFullYear()
      const m = referenceDate.getUTCMonth() - birth.getUTCMonth()
      if (
        m < 0 ||
        (m === 0 && referenceDate.getUTCDate() < birth.getUTCDate())
      ) {
        age--
      }

      if (age >= 18) {
        adultCount++
      } else {
        childCount++
      }
      return { guest, age }
    })

    if (adultCount > (targetRoom.max_adults || 0)) {
      throw new ValidationError({
        message: `O número de adultos (${adultCount}) excede a capacidade máxima do quarto (${targetRoom.max_adults}).`,
        action: "Selecione um quarto com maior capacidade para adultos.",
      })
    }

    if (childCount > (targetRoom.max_children || 0)) {
      throw new ValidationError({
        message: `O número de crianças (${childCount}) excede a capacidade máxima do quarto (${targetRoom.max_children}).`,
        action: "Selecione um quarto com maior capacidade para crianças.",
      })
    }

    // 5. Calculate Total Amount based on Age Policies
    let calculatedTotalAmount = 0
    const policies = targetRoom.price_policies || []

    for (const { age } of guestAges) {
      let percentage = 100 // Default to 100% of price

      if (policies.length > 0) {
        for (const policy of policies) {
          if (age <= policy.max_age) {
            percentage = Number(policy.percentage)
            break
          }
        }
      }

      const guestPrice = Number(targetRoom.price_per_night) * (percentage / 100)
      calculatedTotalAmount += guestPrice
    }

    const {
      check_in_date = targetRoom.hotel_check_in_date || new Date(),
      check_out_date = targetRoom.hotel_check_out_date ||
        new Date(new Date().setDate(new Date().getDate() + 3)),
      total_amount = calculatedTotalAmount,
      company_id = null,
      payment_method = "cash",
      installments_count = 1,
    } = saleInputValues

    let final_discount_percentage = 0
    let final_discount_amount = 0

    if (company_id) {
      const companyResults = await client.query({
        text: `SELECT discount_status FROM companies WHERE id = $1 LIMIT 1`,
        values: [company_id],
      })

      if (
        companyResults.rows[0]?.discount_status === "S" ||
        companyResults.rows[0]?.discount_status === "true"
      ) {
        final_discount_percentage = Number(
          targetRoom.hotel_associated_discount_percentage,
        )
        final_discount_amount = total_amount * (final_discount_percentage / 100)
      }
    }

    const final_amount = total_amount - final_discount_amount

    const sale_number = generateOrderNumber()
    const lead_guest_id = guest_ids[0]

    const saleResults = await client.query({
      text: `
        INSERT INTO
          sales (hotel_id, guest_id, room_id, check_in_date, check_out_date, total_amount, discount_percentage, discount_amount, final_amount, sale_number, company_id, payment_method, installments_count)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING
          *
      `,
      values: [
        targetRoom.hotel_id,
        lead_guest_id,
        room_id,
        check_in_date,
        check_out_date,
        total_amount,
        final_discount_percentage,
        final_discount_amount,
        final_amount,
        sale_number,
        company_id,
        payment_method,
        installments_count,
      ],
    })

    const newSale = saleResults.rows[0]

    // 4.1 Register all guests in sales_guests
    for (const guest_id of guest_ids) {
      await client.query({
        text: `
          INSERT INTO sales_guests (sale_id, guest_id)
          VALUES ($1, $2)
        `,
        values: [newSale.id, guest_id],
      })
    }

    // 5. Update Room Availability
    await client.query({
      text: `
        UPDATE "rooms"
        SET available_rooms = available_rooms - 1
        WHERE id = $1
      `,
      values: [room_id],
    })

    await client.query("COMMIT")
    return newSale
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    await client.end()
  }
}

async function findOneById(saleId) {
  validateUUID(saleId)
  const saleFound = await runSelectQuery(saleId)
  return saleFound

  async function runSelectQuery(saleId) {
    const results = await database.query({
      text: `
        SELECT 
          * 
        FROM 
          sales
        WHERE 
          id = $1
        LIMIT
          1
        ;`,
      values: [saleId],
    })

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O ID da venda informado não foi encontrado no sistema.",
        action: "Verifique se o ID está digitado corretamente.",
      })
    }

    return results.rows[0]
  }
}

async function findAllByHotelId(hotelId) {
  const results = await database.query({
    text: `
      SELECT 
        *
      FROM 
        sales
      WHERE 
        hotel_id = $1
      ORDER BY 
        created_at DESC
    `,
    values: [hotelId],
  })

  return results.rows
}

async function findOneByIdWithDetails(saleId) {
  validateUUID(saleId)
  const results = await database.query({
    text: `
      SELECT 
        sales.*,
        hotels.name as hotel_name,
        hotels.address as hotel_address,
        hotels.city as hotel_city,
        hotels.state as hotel_state,
        hotels.phone as hotel_phone,
        rooms.name as room_name,
        rooms.description as room_description,
        "room-types".name as room_type,
        "room-categories".name as room_category,
        (
          SELECT json_agg(g.*)
          FROM sales_guests sg
          JOIN guests g ON sg.guest_id = g.id
          WHERE sg.sale_id = sales.id
        ) as guests
      FROM 
        sales
      JOIN
        hotels ON sales.hotel_id = hotels.id
      JOIN
        rooms ON sales.room_id = rooms.id
      JOIN
        "room-types" ON rooms.room_type_id = "room-types".id
      JOIN
        "room-categories" ON rooms.room_category_id = "room-categories".id
      WHERE 
        sales.id = $1
    `,
    values: [saleId],
  })

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "O ID da venda informado não foi encontrado no sistema.",
      action: "Verifique se o ID está digitado corretamente.",
    })
  }

  return results.rows[0]
}

async function findAllByGuestId(guestId) {
  const results = await database.query({
    text: `
      SELECT 
        sales.*,
        hotels.name as hotel_name,
        hotels.address as hotel_address,
        hotels.city as hotel_city,
        hotels.state as hotel_state,
        hotels.phone as hotel_phone,
        rooms.name as room_name,
        rooms.description as room_description,
        "room-types".name as room_type,
        "room-categories".name as room_category,
        (
          SELECT json_agg(g.*)
          FROM sales_guests sg
          JOIN guests g ON sg.guest_id = g.id
          WHERE sg.sale_id = sales.id
        ) as guests
      FROM 
        sales
      JOIN
        hotels ON sales.hotel_id = hotels.id
      JOIN
        rooms ON sales.room_id = rooms.id
      JOIN
        "room-types" ON rooms.room_type_id = "room-types".id
      JOIN
        "room-categories" ON rooms.room_category_id = "room-categories".id
      WHERE 
        sales.guest_id = $1
      ORDER BY 
        sales.created_at DESC
    `,
    values: [guestId],
  })

  return results.rows
}

async function findAll() {
  const results = await database.query({
    text: `
      SELECT 
        sales.*,
        hotels.name as hotel_name,
        hotels.address as hotel_address,
        hotels.city as hotel_city,
        hotels.state as hotel_state,
        hotels.phone as hotel_phone,
        rooms.name as room_name,
        rooms.description as room_description,
        "room-types".name as room_type,
        "room-categories".name as room_category,
        (
          SELECT json_agg(g.*)
          FROM sales_guests sg
          JOIN guests g ON sg.guest_id = g.id
          WHERE sg.sale_id = sales.id
        ) as guests
      FROM 
        sales
      JOIN
        hotels ON sales.hotel_id = hotels.id
      JOIN
        rooms ON sales.room_id = rooms.id
      JOIN
        "room-types" ON rooms.room_type_id = "room-types".id
      JOIN
        "room-categories" ON rooms.room_category_id = "room-categories".id
      ORDER BY 
        sales.created_at DESC
    `,
  })

  return results.rows
}

async function update(saleId, saleInputNewValues) {
  if (Object.keys(saleInputNewValues).length === 0) {
    throw new ValidationError({
      message: `Nenhum campo enviado para atualização.`,
      action: "Envie algum campo e tente novamente.",
    })
  }

  const currentSale = await findOneById(saleId)

  if (Object.keys(saleInputNewValues).length > 0) {
    validateRequiredFields(saleInputNewValues, REQUIRED_FIELDS)
  }

  const saleWithNewValues = { ...currentSale, ...saleInputNewValues }

  const updatedSale = await runUpdateQuery(saleWithNewValues)
  return updatedSale

  async function runUpdateQuery(saleWithNewValues) {
    const {
      id,
      guest_id,
      room_id,
      check_in_date,
      check_out_date,
      total_amount,
      company_id,
      payment_method,
      installments_count,
    } = saleWithNewValues

    const results = await database.query({
      text: `
        UPDATE
          sales
        SET 
          guest_id = $2,
          room_id = $3,
          check_in_date = $4,
          check_out_date = $5,
          total_amount = $6,
          company_id = $7,
          payment_method = $8,
          installments_count = $9,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [
        id,
        guest_id,
        room_id,
        check_in_date,
        check_out_date,
        total_amount,
        company_id,
        payment_method,
        installments_count,
      ],
    })

    return results.rows[0]
  }
}

async function deleteById(saleId, hotelId) {
  validateUUID(saleId)
  validateUUID(hotelId)

  await database.query({
    text: `
    DELETE FROM sales
    WHERE hotel_id = $1 and id = $2
    `,
    values: [hotelId, saleId],
  })
}

function generateOrderNumber() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function calculateMaxInstallments(targetDate) {
  if (!targetDate) return 1
  const target = new Date(targetDate)
  const now = new Date()

  // Calculate difference in months
  let months = (target.getFullYear() - now.getFullYear()) * 12
  months -= now.getMonth()
  months += target.getMonth()

  // We want the last installment to be at the month of the event
  // If today is Jan 15 and event is Oct 31:
  // (2026-2026)*12 - 0 + 9 = 9 months.
  // Actually, if it's Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct -> 10 installments.
  // So we add 1.
  const max = Math.max(1, months + 1)
  return max
}

const sale = {
  create,
  findOneById,
  findOneByIdWithDetails,
  findAll,
  findAllByHotelId,
  findAllByGuestId,
  update,
  deleteById,
  calculateMaxInstallments,
}

export default sale
