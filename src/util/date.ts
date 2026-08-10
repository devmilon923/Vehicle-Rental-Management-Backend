/**
 * Helper to parse a date into UTC midnight calendar date.
 */
export const toUTCMidnight = (dateInput: string | Date): Date => {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    throw new Error("Invalid date input");
  }
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

/**
 * Calculates the number of calendar rental days based on requirements:
 * - Same start/end date counts as 1 day (Aug 10 -> Aug 10 = 1 day)
 * - Aug 10 -> Aug 11 = 1 day
 * - Aug 10 -> Aug 12 = 2 days
 * - Aug 10 -> Aug 13 = 3 days
 */
export const calculateRentalDays = (
  startDateInput: string | Date,
  endDateInput: string | Date
): number => {
  const startMidnight = toUTCMidnight(startDateInput);
  const endMidnight = toUTCMidnight(endDateInput);

  const diffMs = endMidnight.getTime() - startMidnight.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    throw new Error("End date cannot be before start date");
  }

  return diffDays === 0 ? 1 : diffDays;
};
