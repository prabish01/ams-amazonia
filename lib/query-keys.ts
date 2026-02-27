export const queryKeys = {
  restaurants: {
    all: ["restaurants"] as const,
    byId: (id: string) => ["restaurants", id] as const,
    staff: (id: string) => ["restaurants", id, "staff"] as const,
    categories: (id: string) => ["restaurants", id, "categories"] as const,
    salaryRates: (id: string) => ["restaurants", id, "salary-rates"] as const,
  },
  staff: {
    all: ["staff"] as const,
    byId: (id: string) => ["staff", id] as const,
    earnings: (id: string, start: string, end: string) =>
      ["staff", id, "earnings", start, end] as const,
  },
  attendance: {
    byStaff: (staffId: string, start?: string, end?: string) =>
      ["attendance", staffId, start, end] as const,
    todayStatus: (staffId: string) =>
      ["attendance", staffId, "today"] as const,
    byRestaurant: (restaurantId: string, date: string) =>
      ["attendance", "restaurant", restaurantId, date] as const,
  },
  leaves: {
    requests: (filters?: object) =>
      ["leaves", "requests", filters] as const,
    requestById: (id: string) => ["leaves", "requests", id] as const,
    balance: (staffId: string, year: number) =>
      ["leaves", "balance", staffId, year] as const,
    categories: ["leaves", "categories"] as const,
    pending: (restaurantId: string) =>
      ["leaves", "pending", restaurantId] as const,
  },
  salary: {
    rates: (restaurantId: string) =>
      ["salary", "rates", restaurantId] as const,
    earnings: (staffId: string, start: string, end: string) =>
      ["salary", "earnings", staffId, start, end] as const,
  },
  reports: {
    individual: (staffId: string, start: string, end: string) =>
      ["reports", "individual", staffId, start, end] as const,
    restaurant: (restaurantId: string, start: string, end: string) =>
      ["reports", "restaurant", restaurantId, start, end] as const,
  },
} as const;
