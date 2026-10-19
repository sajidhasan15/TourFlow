export function calculateBookingPrice(
  pricePerPerson: number,
  totalTravelers: number,
) {
  if (!Number.isInteger(pricePerPerson) || pricePerPerson < 1) {
    throw new Error("Price must be a positive whole number");
  }

  if (
    !Number.isInteger(totalTravelers) ||
    totalTravelers < 1 ||
    totalTravelers > 20
  ) {
    throw new Error("Travelers must be a whole number between 1 and 20");
  }

  const discount = totalTravelers >= 4 ? 0.1 : 0;
  return Math.round(
    pricePerPerson * totalTravelers * (1 - discount),
  );
}