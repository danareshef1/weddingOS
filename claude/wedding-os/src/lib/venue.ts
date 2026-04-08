export function computeVenueTotal(wedding: {
  venuePricePerPerson: number;
  venueMinGuests: number;
  venueReservePrice: number;
  venueExtraHourPrice: number;
  venueExtraPersons: number;
  venueExtraHours: number;
} | null) {
  if (!wedding) return 0;
  return (
    wedding.venuePricePerPerson * wedding.venueMinGuests +
    wedding.venueReservePrice * wedding.venueExtraPersons +
    wedding.venueExtraHourPrice * wedding.venueExtraHours
  );
}
