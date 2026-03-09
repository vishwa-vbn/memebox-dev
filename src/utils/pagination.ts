export function paginate(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
}