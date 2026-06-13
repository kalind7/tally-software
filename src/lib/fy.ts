/** Nepal FY label (e.g. FY 2025/26) from calendar date and FY start month */
export function getFyLabel(now: Date, fyStartMonth: number) {
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  if (month >= fyStartMonth) {
    return `FY ${year}/${String(year + 1).slice(-2)}`;
  }
  return `FY ${year - 1}/${String(year).slice(-2)}`;
}
