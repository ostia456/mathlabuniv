import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    const message = (error.response?.data as any)?.error || 'An error occurred';
    toast.error(message);
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (data: { email: string; password: string; first_name: string; last_name: string }) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data.user;
  },

  updateProfile: async (data: { first_name?: string; last_name?: string; password?: string }) => {
    const response = await apiClient.put('/auth/profile', data);
    return response.data;
  },
};

// Dynamical Systems API
export const dsApi = {
  getSystems: async () => {
    const response = await apiClient.get('/dynamical-systems/systems');
    return response.data.systems;
  },

  simulate: async (data: {
    system: string;
    params?: Record<string, number>;
    initial_state?: number[];
    t_span?: number[];
    dt?: number;
  }) => {
    const response = await apiClient.post('/dynamical-systems/simulate', data);
    return response.data;
  },

  getPhasePortrait: async (data: {
    system: string;
    params?: Record<string, number>;
    x_range?: number[];
    y_range?: number[];
    grid_size?: number;
  }) => {
    const response = await apiClient.post('/dynamical-systems/phase-portrait', data);
    return response.data;
  },

  findEquilibrium: async (data: {
    system: string;
    params?: Record<string, number>;
    guesses?: number[][];
  }) => {
    const response = await apiClient.post('/dynamical-systems/equilibrium', data);
    return response.data;
  },
};

// Numerical Methods API
export const nmApi = {
  getMethods: async () => {
    const response = await apiClient.get('/numerical-methods/methods');
    return response.data.methods;
  },

  solve: async (data: {
    method: string;
    function: string;
    y0: number;
    t0?: number;
    tf: number;
    h?: number;
  }) => {
    const response = await apiClient.post('/numerical-methods/solve', data);
    return response.data;
  },

  compare: async (data: {
    methods: string[];
    function: string;
    y0: number;
    t0?: number;
    tf: number;
    h?: number;
    exact_solution?: string;
  }) => {
    const response = await apiClient.post('/numerical-methods/compare', data);
    return response.data;
  },

  convergenceStudy: async (data: {
    method: string;
    function: string;
    y0: number;
    t0?: number;
    tf: number;
    exact_solution: string;
  }) => {
    const response = await apiClient.post('/numerical-methods/convergence', data);
    return response.data;
  },
};

// Linear Algebra API
export const laApi = {
  transform: async (data: { matrix: number[][]; points?: number[][] }) => {
    const response = await apiClient.post('/linear-algebra/transform', data);
    return response.data;
  },

  svd: async (data: { matrix: number[][] }) => {
    const response = await apiClient.post('/linear-algebra/svd', data);
    return response.data;
  },

  eigen: async (data: { matrix: number[][] }) => {
    const response = await apiClient.post('/linear-algebra/eigen', data);
    return response.data;
  },

  iterative: async (data: {
    A: number[][];
    b: number[];
    x0?: number[];
    method: 'jacobi' | 'gauss_seidel';
    max_iter?: number;
    tol?: number;
  }) => {
    const response = await apiClient.post('/linear-algebra/iterative', data);
    return response.data;
  },

  lu: async (data: { matrix: number[][] }) => {
    const response = await apiClient.post('/linear-algebra/lu', data);
    return response.data;
  },

  visualizeGrid: async (data: { matrix: number[][]; grid_size?: number }) => {
    const response = await apiClient.post('/linear-algebra/visualize-grid', data);
    return response.data;
  },
};

// Graph Theory API
export const gtApi = {
  getAlgorithms: async () => {
    const response = await apiClient.get('/graph-theory/algorithms');
    return response.data.algorithms;
  },

  dijkstra: async (data: {
    adjacency_list: Record<string, [number, number][]>;
    start: number;
    end?: number;
  }) => {
    const response = await apiClient.post('/graph-theory/dijkstra', data);
    return response.data;
  },

  bfs: async (data: {
    adjacency_list: Record<string, [number, number][]>;
    start: number;
  }) => {
    const response = await apiClient.post('/graph-theory/bfs', data);
    return response.data;
  },

  dfs: async (data: {
    adjacency_list: Record<string, [number, number][]>;
    start: number;
  }) => {
    const response = await apiClient.post('/graph-theory/dfs', data);
    return response.data;
  },

  mst: async (data: {
    method: 'prim' | 'kruskal';
    num_nodes: number;
    adjacency_matrix?: number[][];
    edges?: [number, number, number][];
  }) => {
    const response = await apiClient.post('/graph-theory/mst', data);
    return response.data;
  },

  generate: async (data: {
    type: 'random' | 'complete' | 'tree' | 'bipartite';
    num_nodes: number;
    edge_probability?: number;
    weighted?: boolean;
  }) => {
    const response = await apiClient.post('/graph-theory/generate', data);
    return response.data;
  },
};

// Exercises API
export const exerciseApi = {
  generate: async (data: { module: string; type: string; difficulty?: number }) => {
    const response = await apiClient.post('/exercises/generate', data);
    return response.data;
  },

  submit: async (exerciseId: number, data: { answer: any; time_spent?: number }) => {
    const response = await apiClient.post(`/exercises/${exerciseId}/submit`, data);
    return response.data;
  },

  getHistory: async () => {
    const response = await apiClient.get('/exercises/history');
    return response.data.attempts;
  },

  getProgress: async () => {
    const response = await apiClient.get('/exercises/progress');
    return response.data.progress;
  },
};

// Scenarios API
export const scenarioApi = {
  list: async () => {
    const response = await apiClient.get('/scenarios/');
    return response.data.scenarios;
  },

  get: async (id: number) => {
    const response = await apiClient.get(`/scenarios/${id}`);
    return response.data.scenario;
  },

  create: async (data: {
    title: string;
    description?: string;
    module: string;
    config: any;
    locked_params?: string[];
    instructions?: string;
    is_public?: boolean;
  }) => {
    const response = await apiClient.post('/scenarios/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<{
    title: string;
    description: string;
    config: any;
    locked_params: string[];
    instructions: string;
    is_public: boolean;
  }>) => {
    const response = await apiClient.put(`/scenarios/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/scenarios/${id}`);
    return response.data;
  },

  join: async (shareCode: string) => {
    const response = await apiClient.post(`/scenarios/join/${shareCode}`);
    return response.data;
  },

  clone: async (id: number) => {
    const response = await apiClient.post(`/scenarios/${id}/clone`);
    return response.data;
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  },

  getStudents: async () => {
    const response = await apiClient.get('/dashboard/students');
    return response.data.students;
  },

  getStudentDetail: async (studentId: number) => {
    const response = await apiClient.get(`/dashboard/student/${studentId}`);
    return response.data;
  },

  getExerciseStats: async () => {
    const response = await apiClient.get('/dashboard/exercises');
    return response.data.exercises;
  },

  getScenarioStats: async () => {
    const response = await apiClient.get('/dashboard/scenarios');
    return response.data.scenarios;
  },
};

export default apiClient;
