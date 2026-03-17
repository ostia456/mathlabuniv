// User Types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'student' | 'teacher' | 'admin';
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Exercise Types
export interface Exercise {
  id: number;
  title: string;
  description: string;
  module: string;
  difficulty: number;
  problem_data: any;
  solution_data?: any;
  hints: string[];
  time_limit: number;
  points: number;
  is_active: boolean;
  created_at: string;
}

export interface ExerciseAttempt {
  id: number;
  user_id: number;
  exercise_id: number;
  answer_data: any;
  is_correct: boolean;
  score: number;
  feedback: string;
  time_spent: number;
  attempt_number: number;
  created_at: string;
}

// Progress Types
export interface UserProgress {
  id: number;
  user_id: number;
  module: string;
  exercises_completed: number;
  exercises_attempted: number;
  total_points: number;
  time_spent: number;
  current_difficulty: number;
  success_rate: number;
  topic_progress: Record<string, any>;
  last_activity: string;
  updated_at: string;
}

// Scenario Types
export interface Scenario {
  id: number;
  title: string;
  description: string;
  module: string;
  config: any;
  locked_params: string[];
  instructions: string;
  is_public: boolean;
  share_code: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// Dynamical Systems Types
export interface DynamicalSystem {
  id: string;
  name: string;
  params: Record<string, number>;
  equations: string[];
  description: string;
}

export interface SimulationResult {
  t: number[];
  solution: number[][];
  dimensions: number;
  params: Record<string, number>;
  system: string;
}

export interface PhasePortraitData {
  X: number[][];
  Y: number[][];
  U: number[][];
  V: number[][];
  U_norm: number[][];
  V_norm: number[][];
  magnitude: number[][];
}

// Numerical Methods Types
export interface NumericalMethod {
  id: string;
  name: string;
  order: number;
  description: string;
}

export interface NumericalSolution {
  method: string;
  t: number[];
  y: number[];
  steps: number;
  step_size: number;
  error?: number[];
  max_error?: number;
  rms_error?: number;
}

// Linear Algebra Types
export interface MatrixTransformation {
  original: number[][];
  transformed: number[][];
  matrix: number[][];
  properties: {
    determinant: number;
    rank: number;
    singular_values: number[];
    condition_number: number;
    is_invertible: boolean;
  };
  horizontal_lines_original: number[][][];
  horizontal_lines_transformed: number[][][];
  vertical_lines_original: number[][][];
  vertical_lines_transformed: number[][][];
  unit_vectors_original: number[][];
  unit_vectors_transformed: number[][];
}

export interface SVDResult {
  matrix: number[][];
  U: number[][];
  Sigma: number[][];
  singular_values: number[];
  Vt: number[][];
  steps: {
    original: number[][];
    after_Vt: number[][];
    after_Sigma: number[][];
    after_U: number[][];
  };
  properties: {
    rank: number;
    nullity: number;
    condition_number: number;
    frobenius_norm: number;
  };
}

// Graph Theory Types
export interface GraphNode {
  id: string;
  label?: string;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id?: string;
  source: string;
  target: string;
  weight?: number;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface AlgorithmStep {
  current?: number;
  current_node?: number;
  current_distance?: number;
  visited: number[];
  distances?: number[];
  queue?: number[];
  stack?: number[];
}

export interface GraphAlgorithmResult {
  distances?: Record<string, number>;
  predecessors?: Record<string, number | null>;
  path?: number[];
  steps: AlgorithmStep[];
  traversal_order?: number[];
  mst?: Array<[number, number, number]>;
  total_weight?: number;
}
