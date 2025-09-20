const API_BASE_URL = 'http://localhost:3001/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface AuthResponse {
  user: {
    _id: string;
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    dateOfBirth: string;
    isFirstLogin: boolean;
    createdAt: string;
    updatedAt: string;
  };
  token: string;
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('irfis-token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('irfis-token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('irfis-token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication endpoints
  async login(userId: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ userId, password }),
    });

    if (response.success && response.data) {
      this.setToken(response.data.token);
    }

    return response.data!;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  }

  async getCurrentUser(): Promise<AuthResponse['user']> {
    const response = await this.request<{ user: AuthResponse['user'] }>('/auth/me');
    return response.data!.user;
  }

  async createUser(userData: {
    firstName: string;
    lastName: string;
    role: string;
    dateOfBirth: string;
  }): Promise<{ user: AuthResponse['user']; credentials: { userId: string; password: string } }> {
    const response = await this.request('/auth/create-user', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.data!;
  }

  // User management endpoints
  async getUsers(page = 1, limit = 10, filters: { role?: string; search?: string } = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    return this.request(`/users?${params}`);
  }

  async getUserStats() {
    return this.request('/users/stats');
  }

  async getUser(userId: string) {
    return this.request(`/users/${userId}`);
  }

  async updateUser(userId: string, userData: any) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async resetPassword(userId: string) {
    return this.request(`/users/${userId}/reset-password`, {
      method: 'POST',
    });
  }

  // Lot management endpoints
  async createLot(lotData: {
    partName: string;
    factoryName: string;
    lotNumber: string;
    supplyDate: string;
    manufacturingDate: string;
    warrantyPeriod: string;
  }) {
    return this.request('/lots', {
      method: 'POST',
      body: JSON.stringify(lotData),
    });
  }

  async getLots(page = 1, limit = 10, filters: { status?: string } = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    return this.request(`/lots?${params}`);
  }

  async getLot(lotId: string) {
    return this.request(`/lots/${lotId}`);
  }

  async updateLotStatus(lotId: string, status: 'pending' | 'verified' | 'rejected') {
    return this.request(`/lots/${lotId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async generateParts(lotId: string, quantity: number) {
    return this.request(`/lots/${lotId}/generate-parts`, {
      method: 'POST',
      body: JSON.stringify({ quantity }),
    });
  }

  async getLotParts(lotId: string, page = 1, limit = 10, filters: { installed?: boolean } = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    return this.request(`/lots/${lotId}/parts?${params}`);
  }

  // Parts management endpoints
  async getParts(page = 1, limit = 10, filters: any = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    return this.request(`/parts?${params}`);
  }

  async getPart(partId: string) {
    return this.request(`/parts/${partId}`);
  }

  async installPart(partId: string, installationData: {
    location: string;
    section: string;
    installationDate?: string;
  }) {
    return this.request(`/parts/${partId}/install`, {
      method: 'POST',
      body: JSON.stringify(installationData),
    });
  }

  async getInstalledParts(page = 1, limit = 10, filters: any = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    return this.request(`/parts/installed?${params}`);
  }

  async getInstallationHistory(workerId: string, page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return this.request(`/parts/installation-history/${workerId}?${params}`);
  }

  // Inspection endpoints
  async createInspection(inspectionData: {
    partId: string;
    condition: 'good' | 'worn' | 'replace';
    notes?: string;
    photos?: string[];
  }) {
    return this.request('/inspections', {
      method: 'POST',
      body: JSON.stringify(inspectionData),
    });
  }

  async getInspections(page = 1, limit = 10, filters: any = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    return this.request(`/inspections?${params}`);
  }

  async getInspection(inspectionId: string) {
    return this.request(`/inspections/${inspectionId}`);
  }

  async getPartInspectionHistory(partId: string, page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return this.request(`/inspections/part/${partId}?${params}`);
  }

  async getDefectReports(page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return this.request(`/inspections/defects?${params}`);
  }

  async getInspectionSchedule(page = 1, limit = 10, days = 30) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      days: days.toString(),
    });
    return this.request(`/inspections/schedule?${params}`);
  }

  // QR Code endpoints
  async generateQRCode(type: 'lot' | 'part', id: string) {
    return this.request('/qr/generate', {
      method: 'POST',
      body: JSON.stringify({ type, id }),
    });
  }

  async scanQRCode(qrData: string) {
    return this.request('/qr/scan', {
      method: 'POST',
      body: JSON.stringify({ qrData }),
    });
  }

  async getQRCode(type: 'lot' | 'part', id: string) {
    return this.request(`/qr/${type}/${id}`);
  }

  // File upload endpoints
  async uploadInspectionPhotos(files: File[]) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('photos', file);
    });

    const response = await fetch(`${this.baseURL}/upload/inspection-photos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }

  async deletePhoto(filename: string) {
    return this.request(`/upload/inspection-photos/${filename}`, {
      method: 'DELETE',
    });
  }

  getPhotoUrl(filename: string): string {
    return `${this.baseURL}/upload/inspection-photos/${filename}`;
  }
}

// Create and export a singleton instance
export const apiService = new ApiService(API_BASE_URL);
export default apiService;
