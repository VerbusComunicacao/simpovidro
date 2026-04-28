import { Country, State } from "country-state-city"

const normalize = (str) =>
  str
    ?.toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") || ""

export const getCountryByAny = (nameOrCode) => {
  if (!nameOrCode) return null
  const countries = Country.getAllCountries()
  const normalizedInput = normalize(nameOrCode)

  return countries.find(
    (c) =>
      normalize(c.isoCode) === normalizedInput ||
      normalize(c.name) === normalizedInput ||
      normalize(c.native) === normalizedInput,
  )
}

export const getStateByAny = (countryCode, nameOrCode) => {
  if (!countryCode || !nameOrCode) return null
  const states = State.getStatesOfCountry(countryCode)
  const normalizedInput = normalize(nameOrCode)

  return states.find(
    (s) =>
      normalize(s.isoCode) === normalizedInput ||
      normalize(s.name) === normalizedInput,
  )
}

/**
 * Returns normalized location state for forms
 * @param {Object} data - Object containing country and state names/codes
 * @returns {Object} { country, countryCode, state, stateCode, city }
 */
export const getInitialLocationState = (data) => {
  const countryInput = data?.country || "Brasil"
  const stateInput = data?.state || ""
  const cityInput = data?.city || ""

  const countryObj = getCountryByAny(countryInput)
  const countryCode = countryObj?.isoCode || "BR"
  const countryName = countryObj?.name || countryInput

  const stateObj = getStateByAny(countryCode, stateInput)
  const stateCode = stateObj?.isoCode || ""
  const stateName = stateObj?.isoCode || stateInput // Prefer UF code for state value if it's the isoCode, but we'll return both

  return {
    country: countryName,
    countryCode,
    state: stateName, // This will be the code if found, matching old DB format
    stateCode, // This is specifically the ISO code for the selector
    city: cityInput,
  }
}
