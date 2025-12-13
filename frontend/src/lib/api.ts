import axios, { AxiosInstance, AxiosError } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nexa-backend-r7dp.onrender.com/api/v1'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          const refreshToken = localStorage.getItem('refreshToken')
          if (refreshToken) {
            try {
              const { data } = await axios.post(`${API_URL}/auth/refresh`, {
                refreshToken,
              })
              localStorage.setItem('accessToken', data.accessToken)
              // Retry original request
              if (error.config) {
                error.config.headers.Authorization = `Bearer ${data.accessToken}`
                return this.client.request(error.config)
              }
            } catch {
              // Refresh failed, logout
              localStorage.removeItem('accessToken')
              localStorage.removeItem('refreshToken')
              window.location.href = '/login'
            }
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth methods
  async signup(data: {
    email: string
    password: string
    fullName: string
  }) {
    const response = await this.client.post('/auth/signup', data)
    return response.data
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/signin', { email, password })
    return response.data
  }

  async logout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me')
    return response.data
  }

  // Homes methods
  async getHomes() {
    const response = await this.client.get('/homes')
    return response.data
  }

  async getHome(id: string) {
    const response = await this.client.get(`/homes/${id}`)
    return response.data
  }

  async createHome(data: { name: string; address: string; timezone?: string }) {
    const response = await this.client.post('/homes', data)
    return response.data
  }

  // Devices methods
  async getDevices(homeId: string) {
    const response = await this.client.get(`/homes/${homeId}/devices`)
    return response.data
  }

  async getDevice(id: string) {
    const response = await this.client.get(`/devices/${id}`)
    return response.data
  }

  async createDevice(homeId: string, data: {
    device_name: string
    device_type: string
    manufacturer_device_id?: string
    room_id?: string
  }) {
    const response = await this.client.post(`/homes/${homeId}/devices`, data)
    return response.data
  }

  async controlDevice(id: string, command: string, parameters?: any) {
    const response = await this.client.post(`/devices/${id}/control`, {
      command,
      parameters,
    })
    return response.data
  }

  // Automations methods
  async getAutomations(homeId: string) {
    const response = await this.client.get(`/homes/${homeId}/automations`)
    return response.data
  }

  async createAutomation(data: any) {
    const response = await this.client.post('/automations', data)
    return response.data
  }

  async toggleAutomation(id: string, enabled: boolean) {
    const response = await this.client.patch(`/automations/${id}`, { enabled })
    return response.data
  }

  // Energy methods
  async getEnergyConsumption(homeId: string, period: string = '24h') {
    const response = await this.client.get(`/homes/${homeId}/energy/summary`, {
      params: { period },
    })
    return response.data
  }

  // Alerts methods
  async getAlerts(homeId: string) {
    const response = await this.client.get(`/homes/${homeId}/alerts`)
    return response.data
  }

  async resolveAlert(id: string) {
    const response = await this.client.patch(`/alerts/${id}/resolve`)
    return response.data
  }
}

export const api = new ApiClient()
