import { Country, State } from "country-state-city"

export const getCountryByAny = (nameOrCode) => {
  if (!nameOrCode) return null
  const countries = Country.getAllCountries()
  return countries.find(
    (c) =>
      c.isoCode === nameOrCode ||
      c.name === nameOrCode ||
      c.native === nameOrCode,
  )
}

export const getStateByAny = (countryCode, nameOrCode) => {
  if (!countryCode || !nameOrCode) return null
  const states = State.getStatesOfCountry(countryCode)
  return states.find((s) => s.isoCode === nameOrCode || s.name === nameOrCode)
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
