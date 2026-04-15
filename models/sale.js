import { Temporal } from "@js-temporal/polyfill"
import database from "infra/database.js"
import { ValidationError, NotFoundError } from "infra/errors.js"
import { validateRequiredFields, validateUUID } from "infra/validator.js"
import saleInstallment from "models/sale-installment.js"

async function create(saleInputValues, externalClient) {
  validateRequiredFields(saleInputValues, ["guest_ids", "room_id"])

  const { guest_ids, room_id } = saleInputValues

  if (!Array.isArray(guest_ids) || guest_ids.length === 0) {
    throw new ValidationError({
      message: "A lista de hóspedes não pode estar vazia.",
      action: "Adicione pelo menos um hóspede.",
    })
  }

  const client = externalClient || (await database.getNewClient())
  const isInternalTransaction = !externalClient

  try {
    if (isInternalTransaction) await client.query("BEGIN")

    // 1. Validate if room exists and fetch hotel_id, capacity and policies
    const roomResults = await client.query({
      text: `
        SELECT 
          r.*,
          h.check_in_date as hotel_check_in_date,
          h.check_out_date as hotel_check_out_date,
          rc.max_adults,
          rc.max_children,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', pp.id,
                  'max_age', pp.max_age,
                  'description', pp.description,
                  'use_percentage', pp.use_percentage,
                  'percentage', pp.percentage,
                  'price', rpp.price
                ) ORDER BY pp.max_age ASC
              )
              FROM "price_policies" pp
              LEFT JOIN "room_price_policies" rpp ON pp.id = rpp.price_policy_id AND rpp.room_id = r.id
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

    if (adultCount === 0) {
      throw new ValidationError({
        message: "Deve haver pelo menos um adulto (18+) por quarto.",
        action: "Adicione um adulto à inscrição.",
      })
    }

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

    // 4.1 Fetch Company/Discount early to determine if it's a member price
    let companyData = null
    const { company_id = null } = saleInputValues

    if (company_id) {
      const companyResults = await client.query({
        text: `
          SELECT 
            c.custom_discount_percentage,
            d.value as global_discount_value,
            d.name as discount_name
          FROM 
            companies c
          LEFT JOIN 
            discounts d ON c.discount_id = d.id
          WHERE 
            c.id = $1 
          LIMIT 1`,
        values: [company_id],
      })
      companyData = companyResults.rows[0]
    }

    const isMember = companyData?.discount_name === "Associada"

    // 5. Calculate Total Amount based on Age Policies
    let calculatedTotalAmount = 0
    const policies = targetRoom.price_policies || []

    for (const { age } of guestAges) {
      let guestPrice = 0

      if (policies.length > 0) {
        let matchedPolicy = null
        for (const policy of policies) {
          if (age <= policy.max_age) {
            matchedPolicy = policy
            break
          }
        }

        if (matchedPolicy) {
          if (matchedPolicy.use_percentage) {
            const basePrice = isMember
              ? Number(targetRoom.member_price_per_night)
              : Number(targetRoom.price_per_night)
            const percentage = Number(matchedPolicy.percentage || 0)
            guestPrice = basePrice * (percentage / 100)
          } else {
            // Use specific room price for this policy
            guestPrice = Number(matchedPolicy.price || 0)
          }
        } else {
          // No policy matched (adult/older child)
          guestPrice = isMember
            ? Number(targetRoom.member_price_per_night)
            : Number(targetRoom.price_per_night)
        }
      } else {
        // No policies at all
        guestPrice = isMember
          ? Number(targetRoom.member_price_per_night)
          : Number(targetRoom.price_per_night)
      }

      // O cálculo é feito acumulando o preço por pessoa.
      // Não é multiplicado pelo número de noites, pois o preço é por evento/pacote.
      calculatedTotalAmount += guestPrice
    }

    let {
      check_in_date = targetRoom.hotel_check_in_date || new Date(),
      check_out_date = targetRoom.hotel_check_out_date ||
        new Date(new Date().setDate(new Date().getDate() + 3)),
      total_amount = calculatedTotalAmount,
      payment_method = "cash",
      installments_count = 1,
    } = saleInputValues

    const dateSource = targetRoom.hotel_check_in_date
    const dateString =
      dateSource instanceof Date
        ? dateSource.toISOString().split("T")[0]
        : dateSource.split("T")[0]

    const eventDate = Temporal.PlainDate.from(dateString)

    // Enforce fixed installments count if payment method is 'installments'
    if (payment_method === "installments") {
      installments_count = calculateMaxInstallments(eventDate)
    } else {
      installments_count = 1
    }

    let final_discount_percentage = 0
    let final_discount_amount = 0

    if (companyData && !isMember) {
      if (companyData.custom_discount_percentage !== null) {
        final_discount_percentage = Number(
          companyData.custom_discount_percentage,
        )
      } else if (companyData.global_discount_value !== null) {
        final_discount_percentage = Number(companyData.global_discount_value)
      }

      final_discount_amount = total_amount * (final_discount_percentage / 100)
    }

    const final_amount = total_amount - final_discount_amount

    const lead_guest_id = guest_ids[0]

    const saleResults = await client.query({
      text: `
        INSERT INTO
          sales (hotel_id, guest_id, room_id, check_in_date, check_out_date, total_amount, discount_percentage, discount_amount, final_amount, company_id, payment_method, installments_count)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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

    // 6. Generate and Create Installments
    const installmentAmount = (final_amount / installments_count).toFixed(2)
    const installmentDates = saleInstallment.generateInstallmentDates(
      installments_count,
      eventDate,
    )

    const installmentsToCreate = installmentDates.map((date, index) => ({
      sale_id: newSale.id,
      installment_number: index + 1,
      amount: installmentAmount,
      due_date: date,
    }))

    // Adjust the last installment for rounding differences
    const totalInstallmentsAmount = (
      Number(installmentAmount) * installments_count
    ).toFixed(2)
    const diff = (final_amount - Number(totalInstallmentsAmount)).toFixed(2)
    if (Number(diff) !== 0) {
      installmentsToCreate[installments_count - 1].amount = (
        Number(installmentsToCreate[installments_count - 1].amount) +
        Number(diff)
      ).toFixed(2)
    }

    await saleInstallment.createMany(installmentsToCreate, client)

    if (isInternalTransaction) await client.query("COMMIT")
    return newSale
  } catch (error) {
    if (isInternalTransaction) await client.query("ROLLBACK")
    throw error
  } finally {
    if (isInternalTransaction) await client.end()
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
          sales.*,
          guests.user_id as user_id
        FROM 
          sales
        LEFT JOIN
          guests ON sales.guest_id = guests.id
        WHERE 
          sales.id = $1
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
        guests.user_id as user_id,
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
        ) as guests,
        (
          SELECT json_agg(si.* ORDER BY si.installment_number ASC)
          FROM sale_installments si
          WHERE si.sale_id = sales.id
        ) as installments
      FROM 
        sales
      JOIN
        guests ON sales.guest_id = guests.id
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
        ) as guests,
        (
          SELECT json_agg(si.* ORDER BY si.installment_number ASC)
          FROM sale_installments si
          WHERE si.sale_id = sales.id
        ) as installments
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

async function findAll(options = {}) {
  const whereClause = options.hideCancelled
    ? "WHERE sales.status != 'cancelled'"
    : ""

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
        ) as guests,
        (
          SELECT json_agg(si.* ORDER BY si.installment_number ASC)
          FROM sale_installments si
          WHERE si.sale_id = sales.id
        ) as installments
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
      ${whereClause}
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
      status,
      payment_status,
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
          status = $10,
          payment_status = $11,
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
        status,
        payment_status,
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

function calculateMaxInstallments(eventDate) {
  const today = Temporal.Now.plainDateISO()

  if (Temporal.PlainDate.compare(eventDate, today) < 0) return 1

  const monthsBetween = today
    .with({ day: 1 })
    .until(eventDate.with({ day: 1 }), { largestUnit: "months" }).months

  return monthsBetween + 1
}

async function cancel(saleId) {
  validateUUID(saleId)
  const client = await database.getNewClient()

  try {
    await client.query("BEGIN")

    // 1. Lock and fetch sale
    const saleResult = await client.query({
      text: `SELECT * FROM sales WHERE id = $1 FOR UPDATE`,
      values: [saleId],
    })

    const sale = saleResult.rows[0]

    if (!sale) {
      throw new NotFoundError({
        message: "Venda não encontrada.",
        action: "Verifique o ID da venda.",
      })
    }

    if (sale.status === "cancelled") {
      throw new ValidationError({
        message: "Esta venda já está cancelada.",
        action: "Nenhuma ação necessária.",
      })
    }

    // 2. Update Sale Status
    await client.query({
      text: `
        UPDATE sales
        SET 
          status = 'cancelled',
          payment_status = 'cancelled',
          updated_at = timezone('utc', now())
        WHERE id = $1
      `,
      values: [saleId],
    })

    // 3. Restore Room Availability
    await client.query({
      text: `
        UPDATE "rooms"
        SET available_rooms = available_rooms + 1
        WHERE id = $1
      `,
      values: [sale.room_id],
    })

    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    await client.end()
  }
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
  cancel,
}

export default sale
