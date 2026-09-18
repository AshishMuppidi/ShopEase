/**
 * Renders a shipping address (AddressResponse). Tolerant of missing fields so a
 * partially-populated address never throws.
 */
export default function AddressBlock({ address }) {
  if (!address) {
    return <p className="text-sm text-slate-500">No shipping address on file.</p>
  }

  const { fullName, phone, street, city, state, zipCode, country } = address
  const cityLine = [city, state, zipCode].filter(Boolean).join(', ')

  return (
    <address className="not-italic text-sm leading-relaxed text-slate-700">
      {fullName && <div className="font-medium text-slate-800">{fullName}</div>}
      {street && <div>{street}</div>}
      {cityLine && <div>{cityLine}</div>}
      {country && <div>{country}</div>}
      {phone && <div className="mt-1 text-slate-500">{phone}</div>}
    </address>
  )
}
