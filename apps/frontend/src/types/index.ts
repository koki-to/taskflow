export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export type Task = {
    id: string
    title: string
    description: string | null
    status: TaskStatus
    priority: TaskPriority
    dueDate: string | null
    userId: string
    createdAt: string
    updateAt: string
}

export type User = {
    id: string
    email: string
    name: string | null
}

export type AuthResponse = {
    token: string
    user: User
}

export type TasksResponse = {
    tasks: Task[]
}