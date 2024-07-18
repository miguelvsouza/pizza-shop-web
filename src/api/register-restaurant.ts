import { api } from "@/lib/axios"

interface RegisterRestarantBody {
  restaurantName: string
  managerName: string
  email: string
  phone: string
}

export async function registerRestaurant({
  restaurantName,
  managerName,
  email,
  phone,
}: RegisterRestarantBody) {
  await api.post("/restaurants", { restaurantName, managerName, email, phone })
}
