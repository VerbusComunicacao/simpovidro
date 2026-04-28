import React, { useMemo } from "react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Country, State, City } from "country-state-city"

const normalize = (str) =>
  str
    ?.toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") || ""

export function LocationSelector({
  countryCode = "BR",
  stateCode = "",
  cityName = "",
  onLocationChange,
  disabled = false,
  required = false,
  labels = {
    country: "País",
    state: "Estado (UF)",
    city: "Cidade",
  },
}) {
  const countries = useMemo(() => Country.getAllCountries(), [])

  const states = useMemo(
    () => (countryCode ? State.getStatesOfCountry(countryCode) : []),
    [countryCode],
  )

  const cities = useMemo(
    () =>
      countryCode && stateCode
        ? City.getCitiesOfState(countryCode, stateCode)
        : [],
    [countryCode, stateCode],
  )

  const normalizedStateCode = useMemo(() => {
    if (!stateCode || states.length === 0) return stateCode
    const match = states.find(
      (s) => normalize(s.isoCode) === normalize(stateCode),
    )
    return match ? match.isoCode : stateCode
  }, [stateCode, states])

  const normalizedCityName = useMemo(() => {
    if (!cityName || cities.length === 0) return cityName
    const match = cities.find((c) => normalize(c.name) === normalize(cityName))
    return match ? match.name : cityName
  }, [cityName, cities])

  const handleCountryChange = (val) => {
    const countryObj = countries.find((c) => c.isoCode === val)
    onLocationChange({
      country: countryObj?.name || val,
      countryCode: val,
      state: "",
      stateCode: "",
      city: "",
    })
  }

  const handleStateChange = (val) => {
    onLocationChange({
      state: val, // We save the UF code (ISO) as the 'state' value
      stateCode: val,
      city: "",
    })
  }

  const handleCityChange = (val) => {
    onLocationChange({
      city: val,
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label>
          {labels.country} {required && "*"}
        </Label>
        <Select
          value={countryCode}
          onValueChange={handleCountryChange}
          disabled={disabled}
          required={required}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c.isoCode} value={c.isoCode}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>
          {labels.state} {required && "*"}
        </Label>
        <Select
          value={normalizedStateCode}
          onValueChange={handleStateChange}
          disabled={disabled || !countryCode}
          required={required}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {states.map((s) => (
              <SelectItem key={s.isoCode} value={s.isoCode}>
                {s.name} ({s.isoCode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>
          {labels.city} {required && "*"}
        </Label>
        <Select
          value={normalizedCityName}
          onValueChange={handleCityChange}
          disabled={disabled || !stateCode}
          required={required}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((c) => (
              <SelectItem key={c.name} value={c.name}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
