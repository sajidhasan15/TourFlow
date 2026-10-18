export function calculateBookingPrice(pricePerPerson: number, guests: number) {
  if (!Number.isInteger(pricePerPerson) || pricePerPerson < 1) {
    throw new Error("Price must be a positive whole number");
  }

  if (!Number.isInteger(guests) || guests < 1 || guests > 20) {
    throw new Error("Guests must be a whole number between 1 and 20");
  }

  const discount = guests >= 10 ? 0.15 : guests >= 5 ? 0.1 : 0;
  return Math.round(pricePerPerson * guests * (1 - discount));
}