import axios from 'axios'

// axiosインスタンスを作成
// Flutter の dio インスタンスと同じ
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
})

// リクエスト インターセプター
// → すべてのリクエストにJWTトークンを自動付与
// Flutter の dio の RequestInterceptor と同じ
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// レスポンス インターセプター
// → 401エラー（認証切れ）の時にログインページへリダイレクト
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api