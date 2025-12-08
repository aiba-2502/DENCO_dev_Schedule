/**
 * Centralized API Client for DENCO_UI
 *
 * Provides type-safe access to both Python backend (CRUD operations)
 * and Node.js backend (real-time telephony) APIs.
 *
 * Environment Variables:
 * - NEXT_PUBLIC_BACKEND_URL: Python backend URL (default: http://localhost:8000)
 * - NEXT_PUBLIC_NODE_BACKEND_URL: Node.js backend URL (default: http://localhost:3001)
 */

// API base URLs from environment variables
const PYTHON_API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const NODE_API = process.env.NEXT_PUBLIC_NODE_BACKEND_URL || 'http://localhost:3001';

/**
 * Generic HTTP client with error handling
 */
class HttpClient {
  constructor(private baseUrl: string) {}

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status}, url: ${url}`
        );
      }

      return response.json();
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

/**
 * API Client for Python Backend (CRUD operations)
 */
class PythonApiClient extends HttpClient {
  constructor() {
    super(PYTHON_API);
  }

  // Call Sessions API
  calls = {
    active: () => this.get<{ calls: unknown[] }>('/api/calls/active'),
    history: (limit = 50, offset = 0) =>
      this.get<{ calls: unknown[]; total: number }>(
        `/api/calls/history?limit=${limit}&offset=${offset}`
      ),
    list: (params?: { limit?: number; offset?: number }) =>
      this.get<{ calls: unknown[]; total: number }>(
        `/api/calls/history?limit=${params?.limit ?? 50}&offset=${params?.offset ?? 0}`
      ),
    getById: (id: string) => this.get<unknown>(`/api/calls/${id}`),
    // Node.js backend calls (via proxy or direct)
    nodeApi: {
      disconnect: async (callId: string) => {
        const response = await fetch(`${NODE_API}/api/calls/${callId}/disconnect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
          throw new Error(`Failed to disconnect call: ${response.status}`);
        }
        return response.json();
      },
    },
  };

  // Customer API
  customers = {
    list: (params?: { tenantId?: string; limit?: number; offset?: number } | string, limit = 50, offset = 0) => {
      // Support both new object-style and legacy positional args
      if (typeof params === 'object') {
        const { tenantId = '', limit: l = 50, offset: o = 0 } = params;
        return this.get<{ customers: unknown[]; total: number }>(
          `/api/customers?tenant_id=${tenantId}&limit=${l}&offset=${o}`
        );
      }
      // Legacy: params is tenantId string
      return this.get<{ customers: unknown[]; total: number }>(
        `/api/customers?tenant_id=${params || ''}&limit=${limit}&offset=${offset}`
      );
    },
    create: (data: unknown) => this.post<unknown>('/api/customers', data),
    update: (id: string, data: unknown) =>
      this.put<unknown>(`/api/customers/${id}`, data),
    delete: (id: string) => this.delete<unknown>(`/api/customers/${id}`),
  };

  // Knowledge API
  knowledge = {
    articles: {
      list: (params?: { tenantId?: string; limit?: number; offset?: number } | string, limit = 50, offset = 0) => {
        if (typeof params === 'object') {
          const { tenantId = '', limit: l = 50, offset: o = 0 } = params;
          return this.get<{ articles: unknown[]; total: number }>(
            `/api/knowledge/articles?tenant_id=${tenantId}&limit=${l}&offset=${o}`
          );
        }
        return this.get<{ articles: unknown[]; total: number }>(
          `/api/knowledge/articles?tenant_id=${params || ''}&limit=${limit}&offset=${offset}`
        );
      },
      create: (data: unknown) =>
        this.post<unknown>('/api/knowledge/articles', data),
      update: (id: string, data: unknown) =>
        this.put<unknown>(`/api/knowledge/articles/${id}`, data),
      delete: (id: string) =>
        this.delete<unknown>(`/api/knowledge/articles/${id}`),
    },
    inquiries: {
      list: (params?: { tenantId?: string; limit?: number; offset?: number } | string, limit = 50, offset = 0) => {
        if (typeof params === 'object') {
          const { tenantId = '', limit: l = 50, offset: o = 0 } = params;
          return this.get<{ inquiries: unknown[]; total: number }>(
            `/api/knowledge/inquiries?tenant_id=${tenantId}&limit=${l}&offset=${o}`
          );
        }
        return this.get<{ inquiries: unknown[]; total: number }>(
          `/api/knowledge/inquiries?tenant_id=${params || ''}&limit=${limit}&offset=${offset}`
        );
      },
      create: (data: unknown) =>
        this.post<unknown>('/api/knowledge/inquiries', data),
      update: (id: string, data: unknown) =>
        this.put<unknown>(`/api/knowledge/inquiries/${id}`, data),
    },
    // Categories (STUB - バックエンド未実装)
    categories: {
      list: async () => {
        console.warn('⚠️ knowledge.categories.list is using STUB implementation');
        return { categories: [] };
      },
    },
  };

  // FAX API
  fax = {
    /**
     * FAX一覧を取得
     * @param direction - フィルタ値: 'inbound' | 'outbound' | undefined（全件）
     */
    list: (tenantId: string, limit = 50, offset = 0, direction?: 'inbound' | 'outbound') =>
      this.get<{ items: unknown[]; total: number; limit: number; offset: number }>(
        `/api/fax?tenant_id=${tenantId}&limit=${limit}&offset=${offset}${
          direction ? `&direction=${direction}` : ''
        }`
      ),

    /**
     * FAX詳細を取得
     */
    getById: (faxId: string, tenantId: string) =>
      this.get<unknown>(
        `/api/fax/${faxId}?tenant_id=${tenantId}`
      ),

    /**
     * ファイルプレビューURL生成
     *
     * 注意:
     * - Phase 5 のバックエンドエンドポイント実装が完了するまでは404を返す
     * - Phase 5 完了後、api.python.fax.getPreviewUrl() で呼び出し可能になる
     */
    getPreviewUrl: (faxId: string, tenantId: string) =>
      `${PYTHON_API}/api/fax/${faxId}/preview?tenant_id=${tenantId}`,

    /**
     * FAXファイルをアップロード
     */
    upload: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return fetch(`${PYTHON_API}/api/fax/upload`, {
        method: 'POST',
        body: formData,
      }).then(res => res.json());
    },
  };

  // Settings API
  settings = {
    get: (tenantId: string) =>
      this.get<unknown>(`/api/settings?tenant_id=${tenantId}`),
    update: (tenantId: string, data: unknown) =>
      this.put<unknown>(`/api/settings?tenant_id=${tenantId}`, data),
  };

  // Tenants API
  tenants = {
    list: (limit = 50, offset = 0) =>
      this.get<{ tenants: unknown[]; total: number | null; limit: number; offset: number }>(
        `/api/tenants?limit=${limit}&offset=${offset}`
      ),
    getById: (id: string) =>
      this.get<unknown>(`/api/tenants/${id}`),
    getByName: (name: string) =>
      this.get<unknown>(`/api/tenants/by-name/${name}`),
    create: (data: unknown) =>
      this.post<unknown>('/api/tenants', data),
    update: (id: string, data: unknown) =>
      this.put<unknown>(`/api/tenants/${id}/config`, data),
    delete: (id: string) =>
      this.delete<unknown>(`/api/tenants/${id}`),
  };

  // Tags API (STUB - バックエンド未実装)
  tags = {
    list: async () => {
      console.warn('⚠️ tags.list is using STUB implementation - backend not implemented');
      return { tags: [] };
    },
  };

  // Campaigns API (STUB - バックエンド未実装)
  // ⚠️ 本番禁止: バックエンド実装完了後に置き換えること
  campaigns = {
    list: async (params?: { limit?: number; offset?: number }) => {
      console.warn('⚠️ campaigns.list is using STUB implementation - backend not implemented');
      return { campaigns: [], total: 0 };
    },
    getById: async (id: string) => {
      console.warn('⚠️ campaigns.getById is using STUB implementation');
      return null;
    },
    create: async (data: unknown) => {
      console.warn('⚠️ campaigns.create is using STUB implementation');
      return { campaign: { id: `stub-${Date.now()}`, ...data as object } };
    },
    start: async (campaignId: string) => {
      console.warn('⚠️ campaigns.start is using STUB implementation');
      return { success: true };
    },
    update: async (id: string, data: unknown) => {
      throw new Error('campaigns.update is not implemented - backend endpoint does not exist');
    },
    delete: async (id: string) => {
      throw new Error('campaigns.delete is not implemented - backend endpoint does not exist');
    },
    // Campaign Templates (STUB)
    templates: {
      list: async () => {
        console.warn('⚠️ campaigns.templates.list is using STUB implementation');
        return { templates: [] };
      },
      create: async (data: unknown) => {
        console.warn('⚠️ campaigns.templates.create is using STUB implementation');
        return { template: { id: `stub-${Date.now()}`, ...data as object } };
      },
      delete: async (templateId: string) => {
        console.warn('⚠️ campaigns.templates.delete is using STUB implementation');
        return { success: true };
      },
    },
  };

  // Health Check
  healthCheck = () => this.get<{ status: string }>('/health');
}

/**
 * API Client for Node.js Backend (Real-time telephony)
 */
class NodeApiClient extends HttpClient {
  constructor() {
    super(NODE_API);
  }

  // Asterisk Status
  asterisk = {
    status: () => this.get<{ connected: boolean; app: string }>('/api/asterisk/status'),
  };

  // Active Calls
  calls = {
    active: () => this.get<{ calls: unknown[] }>('/api/calls/active'),
  };

  // Health Check
  healthCheck = () => this.get<{ status: string; ari_connected: boolean }>('/health');
}

// Create singleton instances
const pythonClient = new PythonApiClient();
const nodeClient = new NodeApiClient();

/**
 * Unified API Client
 *
 * Usage:
 * ```typescript
 * import { api } from '@/lib/api-client';
 *
 * // Direct access (recommended for most cases)
 * const calls = await api.calls.history(10, 0);
 * const customers = await api.customers.list('tenant-id');
 *
 * // Explicit backend selection
 * const activeCalls = await api.node.calls.active();
 * const asteriskStatus = await api.node.asterisk.status();
 * ```
 */
export const api = {
  // Backend instances
  python: pythonClient,
  node: nodeClient,

  // Direct access to Python backend APIs (convenience accessors)
  calls: pythonClient.calls,
  customers: pythonClient.customers,
  knowledge: pythonClient.knowledge,
  fax: pythonClient.fax,
  settings: pythonClient.settings,
  tenants: pythonClient.tenants,
  campaigns: pythonClient.campaigns,
  tags: pythonClient.tags,

  // Health checks for both backends
  health: {
    python: () => pythonClient.healthCheck(),
    node: () => nodeClient.healthCheck(),
  },
};

/**
 * WebSocket URL builders
 */
export const wsUrls = {
  // Node.js WebSocket for frontend monitoring
  frontend: `${NODE_API.replace('http', 'ws')}/ws/frontend`,

  // Python WebSocket for call audio (internal use only, not for frontend)
  callAudio: (callId: string) =>
    `${PYTHON_API.replace('http', 'ws')}/api/ws/call/${callId}`,
};
