import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "@/store/authStore";
import { API_BASE_URL } from '@/config/constant'

const addInterceptors = (axiosInstance: AxiosInstance) => { 
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const accessToken = useAuthStore.getState().accessToken;

      if (config.headers && !config.headers.Authorization && accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      
      (config.headers as Record<string, string>)['Accept'] = '*/*';
      (config.headers as Record<string, string>)["ngrok-skip-browser-warning"] =
        "true";

      return config;
    },
    (error: unknown) => Promise.reject(error),
  );

  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      if (response.status === 200 || response.statusText === "OK") {
        return response.data;
      }

      return response;
    },
    (error: any) => {
      const status = error.response?.status;

      if (status === 401) {
        useAuthStore.getState().logout();
      }

      return Promise.reject(error.response ?? error);
    },
  );
};

const createAxiosInstance = (baseUrl: string) => {
  const instance = axios.create({
    baseURL: baseUrl,
    // Tắt withCredentials vì server chưa config CORS với credentials
    // Nếu server đã config đúng Access-Control-Allow-Credentials: true,
    // thì có thể bật lại withCredentials: true
    withCredentials: false,
  });

  addInterceptors(instance);

  return instance;
};

// Type helper để TypeScript hiểu interceptor đã return response.data
type ApiClient = Omit<AxiosInstance, 'get' | 'post' | 'put' | 'delete' | 'patch'> & {
  get<T = any>(url: string, config?: any): Promise<T>;
  post<T = any>(url: string, data?: any, config?: any): Promise<T>;
  put<T = any>(url: string, data?: any, config?: any): Promise<T>;
  delete<T = any>(url: string, config?: any): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: any): Promise<T>;
};

export const apiClient = createAxiosInstance(API_BASE_URL) as ApiClient;

export function setupAxiosDefaults() {
  axios.defaults.baseURL = API_BASE_URL;
  addInterceptors(axios);
}
