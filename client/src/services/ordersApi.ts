import { apiGetDataAuthed, apiPostDataAuthed } from './api'

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PAID' | 'SHIPPED'

export type OrderLineProduct = {
  _id: string
  name: string
  slug?: string
  images?: string[]
}

export type OrderLine = {
  quantity: number
  price: number
  product: OrderLineProduct | string | null
}

export type UserOrder = {
  _id: string
  total: number
  status: OrderStatus
  createdAt: string
  items: OrderLine[]
  address?: {
    fullName: string
    phone: string
    city: string
    addressLine1: string
    addressLine2?: string
    postalCode: string
  }
}

export type CreateOrderAddress = {
  fullName: string
  phone: string
  city: string
  addressLine1: string
  addressLine2?: string
  postalCode: string
}

export function fetchMyOrders(): Promise<UserOrder[]> {
  return apiGetDataAuthed<UserOrder[]>('/orders/my-orders')
}

/** Creates an order from the current server cart (cart cleared after success). */
export function createOrder(address: CreateOrderAddress): Promise<UserOrder> {
  return apiPostDataAuthed<UserOrder>('/orders', { address })
}
