import { useRouter } from "next/router"
import useSWR from "swr"
import TableLayout from "@/components/layout/TableLayout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  BedDouble,
  CheckCircle,
} from "lucide-react"
import ErrorDialog from "@/components/ui/ErrorDialog"
import { useEffect, useState } from "react"
import { AddRoomDialog } from "@/components/hotel/AddRoomDialog"
import { EditHotelDialog } from "@/components/hotel/EditHotelDialog"
import { EditRoomDialog } from "@/components/hotel/EditRoomDialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import useUser from "@/hooks/useUser"

const fetcher = async (url) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.")
    error.info = await res.json()
    error.status = res.status
    throw error
  }
  return res.json()
}

export default function HotelPage() {
  const router = useRouter()
  const { id: hotelId } = router.query
  const { user } = useUser()

  const {
    data: hotel,
    error: hotelError,
    mutate: mutateHotel,
  } = useSWR(hotelId ? `/api/v1/hotels/${hotelId}` : null, fetcher)

  const {
    data: rooms,
    error: roomsError,
    mutate: mutateRooms,
  } = useSWR(hotelId ? `/api/v1/rooms?hotel_id=${hotelId}` : null, fetcher)

  const { data: roomTypes, error: roomTypesError } = useSWR(
    "/api/v1/room-types",
    fetcher,
  )
  const { data: roomCategories, error: roomCategoriesError } = useSWR(
    "/api/v1/room-categories",
    fetcher,
  )

  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [errorInfo, setErrorInfo] = useState(null)

  useEffect(() => {
    const error =
      hotelError || roomsError || roomTypesError || roomCategoriesError
    if (error) {
      setErrorInfo({
        title: "Erro ao carregar dados",
        message: error.info?.message || "Ocorreu um erro ao buscar os dados.",
        actionMessage: error.info?.action,
        retry: () => {
          if (hotelError) mutateHotel()
          if (roomsError) mutateRooms()
        },
      })
      setIsErrorDialogOpen(true)
    }
  }, [
    hotelError,
    roomsError,
    roomTypesError,
    roomCategoriesError,
    mutateHotel,
    mutateRooms,
  ])

  const handleActivate = async () => {
    try {
      const response = await fetch(`/api/v1/hotels/${hotelId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active: true }),
      })
      if (response.ok) {
        mutateHotel()
      } else {
        const data = await response.json()
        setErrorInfo({
          title: "Erro ao Ativar Hotel",
          message: data.message || "Ocorreu um erro.",
          actionMessage: data.action,
        })
        setIsErrorDialogOpen(true)
      }
    } catch (error) {
      setErrorInfo({
        title: "Erro ao Ativar Hotel",
        message: "Ocorreu um erro de conexão.",
      })
      setIsErrorDialogOpen(true)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/v1/hotels/${hotelId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        router.push("/table")
      } else {
        const data = await response.json()
        setErrorInfo({
          title: "Erro ao Deletar Hotel",
          message: data.message || "Ocorreu um erro.",
          actionMessage: data.action,
        })
        setIsErrorDialogOpen(true)
      }
    } catch (error) {
      setErrorInfo({
        title: "Erro ao Deletar Hotel",
        message: "Ocorreu um erro de conexão.",
      })
      setIsErrorDialogOpen(true)
    }
  }

  const pageActions = hotel && (
    <>
      {!hotel.active && (
        <Button
          onClick={handleActivate}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="mr-2 h-4 w-4" /> Ativar Hotel
        </Button>
      )}
      {user?.features?.includes("delete:content") && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Deletar Hotel
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso irá deletar
                permanentemente o hotel e todos os seus quartos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      <Link href="/table" passHref>
        <Button variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </Link>
    </>
  )

  const renderEmptyState = () => {
    if (!roomTypes || !roomCategories) {
      return <div>Carregando pré-requisitos...</div>
    }

    if (roomTypes.length === 0 || roomCategories.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="mb-4">
            Você precisa criar tipos e categorias de quartos antes de poder
            adicionar um quarto.
          </p>
          {roomTypes.length === 0 && (
            <Link href="/table/room-types" passHref>
              <Button className="mr-2">Criar Tipos de Quarto</Button>
            </Link>
          )}
          {roomCategories.length === 0 && (
            <Link href="/table/room-categories" passHref>
              <Button>Criar Categorias de Quarto</Button>
            </Link>
          )}
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg">
        <BedDouble className="h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Nenhum quarto cadastrado</h2>
        <p className="text-gray-500 mb-4">
          Comece adicionando um novo quarto para este hotel.
        </p>
        <AddRoomDialog
          hotelId={hotelId}
          roomTypes={roomTypes}
          roomCategories={roomCategories}
          onRoomAdded={mutateRooms}
        >
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Quarto
          </Button>
        </AddRoomDialog>
      </div>
    )
  }

  return (
    <TableLayout pageActions={pageActions}>
      {!hotel && !hotelError && <div>Carregando hotel...</div>}

      {hotel && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{hotel.name}</CardTitle>
                <CardDescription>
                  {hotel.city}, {hotel.state} - {hotel.country}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                {hotel.active && (
                  <Badge variant="success">Este hotel está ativo no site</Badge>
                )}
                <EditHotelDialog hotel={hotel} onHotelUpdated={mutateHotel}>
                  <Button variant="outline" size="sm">
                    <Pencil className="mr-2 h-4 w-4" /> Editar Hotel
                  </Button>
                </EditHotelDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p>{hotel.address}</p>
            <p>
              {hotel.email && hotel.email + " | "} {hotel.phone}
            </p>
            <p className="mt-4 font-medium text-sm">Políticas de idade:</p>
            <ul className="mt-2 space-y-1">
              {hotel.price_policies && hotel.price_policies.length > 0 ? (
                hotel.price_policies.map((policy, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    • {policy.description || `Até ${policy.max_age} anos`}
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-400 italic">
                  Nenhuma política de idade configurada.
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {hotel && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Quartos</CardTitle>
            {rooms && rooms.length > 0 && roomTypes && roomCategories && (
              <AddRoomDialog
                hotelId={hotelId}
                roomTypes={roomTypes}
                roomCategories={roomCategories}
                onRoomAdded={mutateRooms}
              >
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Quarto
                </Button>
              </AddRoomDialog>
            )}
          </CardHeader>
          <CardContent>
            {!rooms && !roomsError && <div>Carregando quartos...</div>}
            {rooms && rooms.length === 0 && renderEmptyState()}
            {rooms && rooms.length > 0 && (
              <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_auto] gap-4 font-medium border-b pb-2 mb-2">
                <div>Tipo</div>
                <div>Categoria</div>
                <div>Preço</div>
                <div>Preço Assoc.</div>
                <div>Total</div>
                <div>Disponível</div>
                <div>Bloqueado</div>
                <div>Ações</div>
              </div>
            )}
            {rooms?.map((room) => (
              <div
                key={room.id}
                className="grid grid-cols-[repeat(7,minmax(0,1fr))_auto] gap-4 py-2 border-b items-center"
              >
                <div>{room.room_type}</div>
                <div>{room.room_category}</div>
                <div>R$ {room.price_per_night}</div>
                <div>R$ {room.member_price_per_night}</div>
                <div>{room.total_rooms}</div>
                <div>{room.available_rooms}</div>
                <div>{room.blocked_rooms}</div>
                <div className="flex gap-2">
                  <EditRoomDialog
                    room={room}
                    roomTypes={roomTypes}
                    roomCategories={roomCategories}
                    onRoomUpdated={mutateRooms}
                  >
                    <Button variant="outline" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </EditRoomDialog>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
        title={errorInfo?.title}
        message={errorInfo?.message}
        actionMessage={errorInfo?.actionMessage}
        onRetry={errorInfo?.retry}
      />
    </TableLayout>
  )
}
