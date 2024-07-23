import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { TableRow, TableCell } from "@/components/ui/table"
import { Search, ArrowRight, X } from "lucide-react"
import { OrderDetails } from "./order-details"
import { OrderStatus } from "@/components/order-status"

import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { cancelOrder } from "@/api/cancel-order"
import { queryClient } from "@/lib/react-query"
import { GetOrdersResponse } from "@/api/get-orders"
import { approveOrder } from "@/api/approve-order"
import { dispatchOrder } from "@/api/dispatch-order"
import { deliverOrder } from "@/api/deliver-order"

interface OrderTableRowProps {
  order: {
    orderId: string
    createdAt: string
    status: "pending" | "canceled" | "processing" | "delivering" | "delivered"
    customerName: string
    total: number
  }
}

interface UpdateOrderStatusOnCacheParams {
  orderId: string
  status: "pending" | "canceled" | "processing" | "delivering" | "delivered"
}

export function OrderTableRow({ order }: OrderTableRowProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  function updateOrderStatusOnCache({
    orderId,
    status,
  }: UpdateOrderStatusOnCacheParams) {
    const cached = queryClient.getQueriesData<GetOrdersResponse>({
      queryKey: ["orders"],
    })

    cached.forEach(([cacheKey, cacheData]) => {
      if (!cacheData) {
        return
      }

      queryClient.setQueryData<GetOrdersResponse>(cacheKey, {
        ...cacheData,
        orders: cacheData.orders.map((order) => {
          if (order.orderId === orderId) {
            return { ...order, status }
          }

          return order
        }),
      })
    })
  }

  const { mutateAsync: cancelOrderFn, isPending: isCanceling } = useMutation({
    mutationFn: cancelOrder,
    onSuccess(_, { orderId }) {
      updateOrderStatusOnCache({ orderId, status: "canceled" })
    },
  })

  const { mutateAsync: approveOrderFn, isPending: isApproving } = useMutation({
    mutationFn: approveOrder,
    onSuccess(_, { orderId }) {
      updateOrderStatusOnCache({ orderId, status: "processing" })
    },
  })

  const { mutateAsync: dispatchOrderFn, isPending: isDispatching } =
    useMutation({
      mutationFn: dispatchOrder,
      onSuccess(_, { orderId }) {
        updateOrderStatusOnCache({ orderId, status: "delivering" })
      },
    })

  const { mutateAsync: deliverOrderFn, isPending: isDelivering } = useMutation({
    mutationFn: deliverOrder,
    onSuccess(_, { orderId }) {
      updateOrderStatusOnCache({ orderId, status: "delivered" })
    },
  })

  return (
    <TableRow>
      <TableCell>
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="xs">
              <Search className="h-3 w-3" />
              <span className="sr-only">Detalhes do pedido</span>
            </Button>
          </DialogTrigger>
          <OrderDetails orderId={order.orderId} open={isDetailOpen} />
        </Dialog>
      </TableCell>
      <TableCell className="font-mono text-xs font-medium">
        {order.orderId}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatDistanceToNow(order.createdAt, {
          locale: ptBR,
          addSuffix: true,
        })}
      </TableCell>
      <TableCell>
        <OrderStatus status={order.status} />
      </TableCell>
      <TableCell>{order.customerName}</TableCell>
      <TableCell className="font-medium">
        {(order.total / 100).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}
      </TableCell>
      <TableCell>
        {order.status === "pending" && (
          <Button
            onClick={() => approveOrderFn({ orderId: order.orderId })}
            disabled={isApproving}
            variant="outline"
            size="xs"
          >
            <ArrowRight className="h-3 w-3 mr-2" />
            Aprovar
          </Button>
        )}

        {order.status === "processing" && (
          <Button
            onClick={() => dispatchOrderFn({ orderId: order.orderId })}
            disabled={isDispatching}
            variant="outline"
            size="xs"
          >
            <ArrowRight className="h-3 w-3 mr-2" />
            Em entrega
          </Button>
        )}

        {order.status === "delivering" && (
          <Button
            onClick={() => deliverOrderFn({ orderId: order.orderId })}
            disabled={isDelivering}
            variant="outline"
            size="xs"
          >
            <ArrowRight className="h-3 w-3 mr-2" />
            Entregue
          </Button>
        )}
      </TableCell>
      <TableCell>
        <Button
          onClick={() => cancelOrderFn({ orderId: order.orderId })}
          disabled={
            !["pending", "processing"].includes(order.status) || isCanceling
          }
          variant="ghost"
          size="xs"
        >
          <X className="h-3 w-3 mr-2" />
          Cancelar
        </Button>
      </TableCell>
    </TableRow>
  )
}
