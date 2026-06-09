import { Temporal } from "@js-temporal/polyfill"
import database from "infra/database.js"
import { ValidationError, NotFoundError } from "infra/errors.js"
import { validateRequiredFields, validateUUID } from "infra/validator.js"
import saleInstallment from "models/sale-installment.js"
import discountModel from "models/discount.js"
import {
  calculateTotalPrice,
  calculateMaxInstallments,
} from "../lib/registration-helpers.js"

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

    // 1. Validate if room exists and fetch parent/inventory settings
    const parentCheck = await client.query({
      text: `SELECT parent_room_id FROM "rooms" WHERE id = $1`,
      values: [room_id],
    })

    if (parentCheck.rowCount === 0) {
      throw new NotFoundError({
        message: "Quarto não encontrado.",
        action: "Selecione outro quarto.",
      })
    }

    const inventoryRoomId = parentCheck.rows[0].parent_room_id || room_id

    // Acquire exclusive row-level lock on the master inventory room to serialize concurrent bookings
    await client.query({
      text: `SELECT id FROM "rooms" WHERE id = $1 FOR UPDATE`,
      values: [inventoryRoomId],
    })

    // Fetch the room capacity, pricing, policies, and the latest available room count from parent
    const roomResults = await client.query({
      text: `
        SELECT 
          r.*,
          (SELECT available_rooms FROM "rooms" WHERE id = $2) as latest_available_rooms,
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
        LIMIT 1;`,
      values: [room_id, inventoryRoomId],
    })

    const targetRoom = roomResults.rows[0]

    if (!targetRoom) {
      throw new NotFoundError({
        message: "Quarto não encontrado.",
        action: "Selecione outro quarto.",
      })
    }

    // 2. Check room availability
    if (targetRoom.latest_available_rooms <= 0) {
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

    // 3.5 Check for overlapping registrations for these guests in this hotel (ignoring cancelled bookings & pending placeholders)
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
                AND s.status != 'cancelled'
                AND g.is_pending_info = false
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

      if (age >= 12) {
        adultCount++
      } else {
        childCount++
      }
      return { guest, age }
    })

    const holderAge = guestAges[0]?.age || 0
    if (holderAge < 18) {
      throw new ValidationError({
        message: "O titular da inscrição deve ser maior de 18 anos.",
        action: "Altere o titular da inscrição para um adulto maior de 18.",
      })
    }

    if (adultCount === 0) {
      throw new ValidationError({
        message: "Deve haver pelo menos um hóspede adulto por quarto.",
        action: "Adicione um hóspede adulto à inscrição.",
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

    if (adultCount < (targetRoom.min_guests || 1)) {
      throw new ValidationError({
        message: `Este quarto exige no mínimo ${targetRoom.min_guests} hóspedes adultos.`,
        action: "Adicione mais hóspedes adultos para continuar.",
      })
    }

    // 4.1 Fetch Company/Discount early to determine if it's a member price
    let companyData = null
    const { company_id = null } = saleInputValues

    if (company_id) {
      const companyResults = await client.query({
        text: `SELECT * FROM companies WHERE id = $1 LIMIT 1`,
        values: [company_id],
      })
      companyData = companyResults.rows[0]
    }

    const globalDiscounts = await discountModel.getAllActiveDiscounts()

    const pricing = calculateTotalPrice(
      targetRoom,
      guests.rows,
      companyData,
      globalDiscounts,
    )

    let {
      check_in_date = targetRoom.hotel_check_in_date || new Date(),
      check_out_date = targetRoom.hotel_check_out_date ||
        new Date(new Date().setDate(new Date().getDate() + 3)),
      total_amount = pricing.originalTotal,
      payment_method = "cash",
      installments_count = 1,
      user_id = null,
      checkout_question_response = null,
    } = saleInputValues

    const dateSource = targetRoom.hotel_check_in_date
    const dateString =
      dateSource instanceof Date
        ? dateSource.toISOString().split("T")[0]
        : dateSource.split("T")[0]

    const eventDate = Temporal.PlainDate.from(dateString)

    // Enforce fixed installments count if payment method is 'installments'
    if (payment_method === "installments") {
      installments_count = calculateMaxInstallments(dateString)
    } else {
      installments_count = 1
    }

    const final_discount_percentage = pricing.discountPercentage
    const final_discount_amount = pricing.discountAmount
    const final_amount = pricing.finalTotal

    const lead_guest_id = guest_ids[0]

    const saleResults = await client.query({
      text: `
        INSERT INTO
          sales (hotel_id, guest_id, room_id, check_in_date, check_out_date, total_amount, discount_percentage, discount_amount, final_amount, company_id, payment_method, installments_count, bed_preference, user_id, checkout_question_response)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
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
        saleInputValues.bed_preference || null,
        user_id,
        checkout_question_response,
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

    // 5. Update Room Availability (on the parent/inventory room and sync children)
    await client.query({
      text: `
        UPDATE "rooms"
        SET available_rooms = available_rooms - 1
        WHERE id = $1
      `,
      values: [inventoryRoomId],
    })

    await client.query({
      text: `
        UPDATE "rooms"
        SET available_rooms = (SELECT available_rooms FROM "rooms" WHERE id = $1)
        WHERE parent_room_id = $1 OR id = $1
      `,
      values: [inventoryRoomId],
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
        hotels.checkout_question as hotel_checkout_question,
        rooms.name as room_name,
        rooms.description as room_description,
        rooms.price_per_night as room_price_per_night,
        rooms.member_price_per_night as room_member_price_per_night,
        "room-types".name as room_type,
        "room-categories".name as room_category,
        companies.corporate_name as company_corporate_name,
        companies.cnpj as company_cnpj,
        companies.badge as company_badge,
        companies.phone as company_phone,
        companies.address as company_address,
        companies.address_number as company_address_number,
        companies.address_complement as company_address_complement,
        companies.neighborhood as company_neighborhood,
        companies.city as company_city,
        companies.state as company_state,
        companies.zip_code as company_zip_code,
        companies.responsible_person as company_responsible_person,
        companies.email as company_email,
        companies.activity_sector as company_activity_sector,
        companies.country as company_country,
        (SELECT name FROM discounts WHERE id = companies.discount_id) as company_discount_name,
        (
          SELECT json_agg(pp.* ORDER BY pp.max_age ASC)
          FROM "price_policies" pp
          WHERE pp.hotel_id = sales.hotel_id
        ) as price_policies,
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
      LEFT JOIN
        companies ON sales.company_id = companies.id
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

async function findAllByUserId(userId) {
  validateUUID(userId)
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
        sales.user_id = $1
        OR sales.guest_id IN (SELECT id FROM guests WHERE user_id = $1)
      ORDER BY 
        sales.created_at DESC
    `,
    values: [userId],
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
          SELECT json_agg(pp.* ORDER BY pp.max_age ASC)
          FROM "price_policies" pp
          WHERE pp.hotel_id = sales.hotel_id
        ) as price_policies,
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
      checkout_question_response,
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
          checkout_question_response = $12,
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
        checkout_question_response,
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

    // 3. Restore Room Availability (on the parent/inventory room and sync children)
    const roomCheck = await client.query({
      text: `SELECT parent_room_id FROM "rooms" WHERE id = $1`,
      values: [sale.room_id],
    })

    const parentRoomId = roomCheck.rows[0]?.parent_room_id
    const inventoryRoomId = parentRoomId || sale.room_id

    await client.query({
      text: `
        UPDATE "rooms"
        SET available_rooms = available_rooms + 1
        WHERE id = $1
      `,
      values: [inventoryRoomId],
    })

    await client.query({
      text: `
        UPDATE "rooms"
        SET available_rooms = (SELECT available_rooms FROM "rooms" WHERE id = $1)
        WHERE parent_room_id = $1 OR id = $1
      `,
      values: [inventoryRoomId],
    })

    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    await client.end()
  }
}

async function replaceGuest(saleId, oldGuestId, newGuestId, externalClient) {
  validateUUID(saleId)
  validateUUID(oldGuestId)
  validateUUID(newGuestId)

  if (oldGuestId === newGuestId) {
    throw new ValidationError({
      message: "O novo hóspede é o mesmo que o hóspede atual.",
      action: "Selecione um hóspede diferente para realizar a troca.",
    })
  }

  const client = externalClient || (await database.getNewClient())
  const isInternalTransaction = !externalClient

  try {
    if (isInternalTransaction) await client.query("BEGIN")

    // 1. Lock and fetch sale
    const saleResult = await client.query({
      text: `SELECT * FROM sales WHERE id = $1 FOR UPDATE`,
      values: [saleId],
    })

    const targetSale = saleResult.rows[0]

    if (!targetSale) {
      throw new NotFoundError({
        message: "Inscrição não encontrada.",
        action: "Verifique o ID da inscrição.",
      })
    }

    if (targetSale.status === "cancelled") {
      throw new ValidationError({
        message: "Não é possível alterar hóspedes de uma inscrição cancelada.",
        action: "Inscrições canceladas não podem sofrer alterações.",
      })
    }

    // 2. Verify that oldGuestId is in sales_guests for this sale
    const oldGuestCheck = await client.query({
      text: `SELECT 1 FROM sales_guests WHERE sale_id = $1 AND guest_id = $2`,
      values: [saleId, oldGuestId],
    })

    if (oldGuestCheck.rowCount === 0) {
      throw new NotFoundError({
        message: "O hóspede atual não faz parte desta inscrição.",
        action: "Verifique se selecionou o hóspede correto.",
      })
    }

    // 3. Verify that newGuestId is not already in the same sale
    const newGuestInSaleCheck = await client.query({
      text: `SELECT 1 FROM sales_guests WHERE sale_id = $1 AND guest_id = $2`,
      values: [saleId, newGuestId],
    })

    if (newGuestInSaleCheck.rowCount > 0) {
      throw new ValidationError({
        message: "O novo hóspede já faz parte desta inscrição.",
        action: "Selecione outro hóspede para a troca.",
      })
    }

    // 4. Verify new guest capacity/overlap checks
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
          sg.guest_id = $1 
          AND r.hotel_id = $2
          AND s.status != 'cancelled'
          AND g.is_pending_info = false
          AND s.id != $3
        LIMIT 1;`,
      values: [newGuestId, targetSale.hotel_id, saleId],
    })

    if (overlapResults.rowCount > 0) {
      throw new ValidationError({
        message: `O hóspede ${overlapResults.rows[0].name} já possui uma inscrição ativa para este hotel.`,
        action: "Verifique as inscrições deste hóspede.",
      })
    }

    // 5. Fetch all guests in the sale after the swap to check capacity
    const salesGuestsResult = await client.query({
      text: `SELECT guest_id FROM sales_guests WHERE sale_id = $1`,
      values: [saleId],
    })
    const currentGuestIds = salesGuestsResult.rows.map((r) => r.guest_id)
    const newGuestIds = currentGuestIds.map((id) =>
      id === oldGuestId ? newGuestId : id,
    )

    const guests = await client.query({
      text: `SELECT id, birth_date, name FROM guests WHERE id = ANY($1)`,
      values: [newGuestIds],
    })

    if (guests.rowCount !== newGuestIds.length) {
      throw new NotFoundError({
        message: "O novo hóspede informado não foi encontrado.",
        action: "Selecione um hóspede cadastrado.",
      })
    }

    const roomResults = await client.query({
      text: `
        SELECT 
          rc.max_adults,
          rc.max_children,
          r.min_guests,
          h.check_in_date as hotel_check_in_date
        FROM 
          "rooms" r
        JOIN 
          "hotels" h ON r.hotel_id = h.id
        JOIN
          "room-categories" rc ON r.room_category_id = rc.id
        WHERE 
          r.id = $1
        LIMIT 1;`,
      values: [targetSale.room_id],
    })
    const targetRoom = roomResults.rows[0]

    const referenceDate = new Date(
      targetSale.check_in_date || targetRoom.hotel_check_in_date || new Date(),
    )
    let adultCount = 0
    let childCount = 0

    guests.rows.forEach((guest) => {
      const birth = new Date(guest.birth_date)
      let age = referenceDate.getUTCFullYear() - birth.getUTCFullYear()
      const m = referenceDate.getUTCMonth() - birth.getUTCMonth()
      if (
        m < 0 ||
        (m === 0 && referenceDate.getUTCDate() < birth.getUTCDate())
      ) {
        age--
      }

      if (age >= 12) {
        adultCount++
      } else {
        childCount++
      }
    })

    const leadGuestId =
      targetSale.guest_id === oldGuestId ? newGuestId : targetSale.guest_id
    const leadGuestObj = guests.rows.find((g) => g.id === leadGuestId)
    if (leadGuestObj) {
      const leadBirth = new Date(leadGuestObj.birth_date)
      let leadAge = referenceDate.getUTCFullYear() - leadBirth.getUTCFullYear()
      const lm = referenceDate.getUTCMonth() - leadBirth.getUTCMonth()
      if (
        lm < 0 ||
        (lm === 0 && referenceDate.getUTCDate() < leadBirth.getUTCDate())
      ) {
        leadAge--
      }
      if (leadAge < 18) {
        throw new ValidationError({
          message: "O titular da inscrição deve ser maior de 18 anos.",
          action: "Altere o titular da inscrição para um adulto maior de 18.",
        })
      }
    }

    if (adultCount === 0) {
      throw new ValidationError({
        message: "Deve haver pelo menos um hóspede adulto por quarto.",
        action: "Adicione um hóspede adulto à inscrição.",
      })
    }

    if (targetRoom) {
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

      if (adultCount < (targetRoom.min_guests || 1)) {
        throw new ValidationError({
          message: `Este quarto exige no mínimo ${targetRoom.min_guests} hóspedes adultos.`,
          action: "Adicione mais hóspedes adultos para continuar.",
        })
      }
    }

    // 6. Update sales_guests table
    await client.query({
      text: `
        UPDATE sales_guests 
        SET guest_id = $3 
        WHERE sale_id = $1 AND guest_id = $2
      `,
      values: [saleId, oldGuestId, newGuestId],
    })

    // Get company CNPJ linked to the sale (if any) and update the new guest
    let companyCnpj = null
    if (targetSale.company_id) {
      const companyResult = await client.query({
        text: `SELECT cnpj FROM companies WHERE id = $1`,
        values: [targetSale.company_id],
      })
      if (companyResult.rowCount > 0) {
        companyCnpj = companyResult.rows[0].cnpj
      }
    }

    await client.query({
      text: `UPDATE guests SET company_cnpj = $2 WHERE id = $1`,
      values: [newGuestId, companyCnpj],
    })

    // 7. If lead guest is being replaced, update the lead guest ID in sales table
    if (targetSale.guest_id === oldGuestId) {
      await client.query({
        text: `
          UPDATE sales 
          SET guest_id = $2 
          WHERE id = $1
        `,
        values: [saleId, newGuestId],
      })
    }

    if (isInternalTransaction) await client.query("COMMIT")

    if (isInternalTransaction) {
      return await findOneByIdWithDetails(saleId)
    }
  } catch (error) {
    if (isInternalTransaction) await client.query("ROLLBACK")
    throw error
  } finally {
    if (isInternalTransaction) await client.end()
  }
}

async function updateBedPreference(saleId, bedPreference) {
  if (!["Duplo Casal", "Duplo Solteiro"].includes(bedPreference)) {
    throw new ValidationError({
      message: "Preferência de cama inválida.",
      action: "Selecione 'Duplo Casal' ou 'Duplo Solteiro'.",
    })
  }

  const client = await database.getNewClient()
  try {
    await client.query("BEGIN")

    const saleResult = await client.query({
      text: `SELECT * FROM sales WHERE id = $1 FOR UPDATE`,
      values: [saleId],
    })

    const targetSale = saleResult.rows[0]

    if (!targetSale) {
      throw new NotFoundError({
        message: "Inscrição não encontrada.",
        action: "Verifique o ID da inscrição.",
      })
    }

    if (targetSale.status === "cancelled") {
      throw new ValidationError({
        message:
          "Não é possível alterar a acomodação de uma inscrição cancelada.",
        action: "Inscrições canceladas não podem sofrer alterações.",
      })
    }

    const results = await client.query({
      text: `
        UPDATE sales
        SET 
          bed_preference = $2,
          updated_at = timezone('utc', now())
        WHERE id = $1
        RETURNING *
      `,
      values: [saleId, bedPreference],
    })

    await client.query("COMMIT")
    return results.rows[0]
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
  findAllByUserId,
  update,
  deleteById,
  calculateMaxInstallments,
  cancel,
  replaceGuest,
  updateBedPreference,
}

export default sale
