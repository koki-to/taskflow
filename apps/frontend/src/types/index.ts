// apps/frontend/src/types/index.ts

export type TaskStatus   = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

// ── ベース型 ────────────────────────────────────────
export type Task = {
    id:          string
    title:       string
    description: string | null
    status:      TaskStatus
    priority:    TaskPriority
    dueDate:     string | null
    userId:      string
    createdAt:   string
    updatedAt:   string
}

export type User = {
    id:    string
    email: string
    name:  string | null
}

// ── リクエスト型 ─────────────────────────────────────
export type CreateTaskInput = Omit<
    Task, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'
>

export type UpdateTaskInput = Partial<
    Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'dueDate'>
>

// ── 表示用の軽量型 ───────────────────────────────────
export type TaskSummary = Pick<
    Task, 'id' | 'title' | 'status' | 'priority' | 'dueDate'
>

// ── APIレスポンス型 ──────────────────────────────────
export type ApiResponse<T> = {
  data:    T
  success: boolean
}

export type TaskResponse  = ApiResponse<Task>
export type TasksResponse = ApiResponse<Task[]>
export type UserResponse  = ApiResponse<User>
export type AuthResponse  = { token: string; user: User }

// ── エラー型 ─────────────────────────────────────────
export type ApiError =
    | { type: 'validationError'; message: string; fields:   string[] }
    | { type: 'unauthorized';    message: string }
    | { type: 'notFound';        message: string; resource: string   }
    | { type: 'serverError';     message: string; detail:   string   }

// ── Result型 ─────────────────────────────────────────
export type Result<T> =
    | { success: true;  data:  T        }
    | { success: false; error: ApiError }