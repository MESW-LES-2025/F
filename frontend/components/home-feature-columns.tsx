"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2, AlertCircle, ShoppingBasket } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useHouse } from "@/lib/house-context"
import { getTasks } from "@/lib/tasks-service"
import { getPantryItems } from "@/lib/pantry-service"
import { apiGet } from "@/lib/api-client"
import { ExpensesList } from "@/components/expenses-list"
import type { Task, PantryItem } from "@/lib/types"

export function HomeFeatureColumns() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ActivitiesColumn />
            <PantryColumn />
            <ExpensesColumn />
        </div>
    )
}

function ActivitiesColumn() {
    const { selectedHouse } = useHouse()
    const [tasks, setTasks] = useState<Task[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadTasks = async () => {
            if (!selectedHouse) return
            try {
                setIsLoading(true)
                const fetchedTasks = await getTasks({ houseId: selectedHouse.id, archived: 'false' })
                // Filter for todo and doing tasks
                const activeTasks = fetchedTasks.filter(t => t.status === 'todo' || t.status === 'doing')
                setTasks(activeTasks)
            } catch (err) {
                console.error('Failed to load tasks:', err)
            } finally {
                setIsLoading(false)
            }
        }
        loadTasks()
    }, [selectedHouse])

    return (
        <Card className="h-full flex flex-col border-none shadow-sm bg-white/50 hover:bg-white transition-colors">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        Activities
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                        <Link href="/activities">
                            View all <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px]">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-500">
                        <p className="text-sm">No active tasks</p>
                        <Button variant="link" size="sm" asChild>
                            <Link href="/activities">Create a task</Link>
                        </Button>
                    </div>
                ) : (
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-3">
                            {tasks.slice(0, 5).map(task => (
                                <div key={task.id} className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant={task.status === 'doing' ? 'default' : 'secondary'} className="text-[10px] px-1.5 h-5">
                                                    {task.status}
                                                </Badge>
                                                <span className="text-xs text-gray-500 truncate">
                                                    {task.assignee}
                                                </span>
                                            </div>
                                        </div>
                                        <Avatar className="w-6 h-6">
                                            <AvatarImage src={task.assigneeAvatar || "/placeholder.svg"} />
                                            <AvatarFallback className="text-[10px]">
                                                {task.assignee?.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    )
}

function PantryColumn() {
    const { selectedHouse } = useHouse()
    const [items, setItems] = useState<PantryItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadPantry = async () => {
            if (!selectedHouse) return
            try {
                setIsLoading(true)
                // We need pantry ID first, but getPantryItems only needs houseId? 
                // Checking pantry-service.ts... getPantryItems(houseId) seems to work directly if implemented that way.
                // But in PantryPage it fetches pantry ID first. Let's check getPantryItems implementation.
                // Assuming getPantryItems takes houseId as per usage in PantryPage (wait, PantryPage passes selectedHouse.id to getPantryItems).
                const fetchedItems = await getPantryItems(selectedHouse.id)

                // Filter for low stock or expiring soon, or just show recent?
                // Let's show low stock first, then others
                const sorted = fetchedItems.sort((a, b) => {
                    if (a.lowStock && !b.lowStock) return -1
                    if (!a.lowStock && b.lowStock) return 1
                    return 0
                })

                setItems(sorted)
            } catch (err) {
                console.error('Failed to load pantry:', err)
            } finally {
                setIsLoading(false)
            }
        }
        loadPantry()
    }, [selectedHouse])

    return (
        <Card className="h-full flex flex-col border-none shadow-sm bg-white/50 hover:bg-white transition-colors">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <ShoppingBasket className="w-5 h-5 text-orange-500" />
                        Pantry
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                        <Link href="/pantry">
                            View all <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px]">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-500">
                        <p className="text-sm">Pantry is empty</p>
                        <Button variant="link" size="sm" asChild>
                            <Link href="/pantry">Add items</Link>
                        </Button>
                    </div>
                ) : (
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-3">
                            {items.slice(0, 6).map(item => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${item.lowStock ? 'bg-red-500' : 'bg-green-500'}`} />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                            <p className="text-xs text-gray-500">{item.quantity} {item.unit}</p>
                                        </div>
                                    </div>
                                    {item.lowStock && (
                                        <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-[10px]">
                                            Low Stock
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    )
}

function ExpensesColumn() {
    const { selectedHouse } = useHouse()

    return (
        <Card className="h-full flex flex-col border-none shadow-sm bg-white/50 hover:bg-white transition-colors">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">€</div>
                        Expenses
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                        <Link href="/expenses">
                            View all <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px]">
                {selectedHouse ? (
                    <ExpensesList
                        houseId={selectedHouse.id}
                        sortField="date"
                        sortOrder="desc"
                        filterCategory="all"
                        filterDateFrom=""
                        filterDateTo=""
                        compact={true}
                        limit={5}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        Loading...
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
