import { fakerPT_BR as faker } from "@faker-js/faker"
import { cpf, cnpj } from "cpf-cnpj-validator"
import { State, City } from "country-state-city"

export const isTestEnvironment = () => {
  return (
    ["test", "development"].includes(process.env.NODE_ENV) ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
    process.env.VERCEL_ENV === "preview"
  )
}

const getRandomLocation = () => {
  const states = State.getStatesOfCountry("BR")
  const randomState = faker.helpers.arrayElement(states)
  const cities = City.getCitiesOfState("BR", randomState.isoCode)
  const randomCity = faker.helpers.arrayElement(cities)

  return {
    state: randomState.isoCode,
    stateCode: randomState.isoCode,
    city: randomCity.name,
  }
}

export const generateRandomCompany = () => {
  const corporateName = faker.company.name()
  const location = getRandomLocation()

  return {
    corporate_name: corporateName,
    badge: corporateName.substring(0, 20),
    responsible_person: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number({ style: "national" }),
    cnpj: cnpj.generate(true),
    address: faker.location.street(),
    address_number: String(faker.number.int({ min: 1, max: 2000 })),
    neighborhood: faker.location.county(), // No neighborhood in pt_BR faker usually, county is a good proxy or just string
    zip_code: faker.location.zipCode("#####-###"),
    ...location,
    countryCode: "BR",
  }
}

export const generateRandomGuest = () => {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  const fullName = `${firstName} ${lastName}`
  const gender = faker.helpers.arrayElement(["M", "F"])
  const location = getRandomLocation()

  return {
    name: fullName,
    full_name: fullName,
    email: faker.internet.email({ firstName, lastName }),
    phone: faker.phone.number({ style: "national" }),
    cpf_number: cpf.generate(true),
    rg_number: faker.string.numeric(9),
    gender: gender,
    birth_date: faker.date
      .birthdate({ min: 18, max: 65, mode: "age" })
      .toISOString()
      .split("T")[0],
    nationality: "Brasileira",
    address: faker.location.street(),
    address_number: String(faker.number.int({ min: 1, max: 2000 })),
    neighborhood: faker.location.county(),
    zip_code: faker.location.zipCode("#####-###"),
    ...location,
    countryCode: "BR",
    country: "Brasil",
    emergency_contact_name: faker.person.fullName(),
    emergency_contact_phone: faker.phone.number({ style: "national" }),
  }
}
