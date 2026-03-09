const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

interface ApiOptions {
  method?: string;
  body?: any;
  token?: string;
  isFormData?: boolean;
}

export async function api<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token, isFormData } = options;

  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${endpoint}`, config);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data as T;
}

export function formatPrice(price: number, currency: string = 'IDR'): string {
  if (currency === 'IDR') {
    if (price >= 1_000_000_000) {
      return `Rp ${(price / 1_000_000_000).toFixed(1)} M`;
    }
    if (price >= 1_000_000) {
      return `Rp ${(price / 1_000_000).toFixed(0)} Juta`;
    }
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
  }
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency }).format(price);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export const propertyTypes = [
  { value: 'rent', label: 'Sewa' },
  { value: 'sell', label: 'Jual' },
  { value: 'both', label: 'Sewa & Jual' },
];

export const propertyCategories = [
  { value: 'house', label: 'Rumah' },
  { value: 'apartment', label: 'Apartemen' },
  { value: 'villa', label: 'Villa' },
  { value: 'land', label: 'Tanah' },
  { value: 'commercial', label: 'Komersial' },
  { value: 'warehouse', label: 'Gudang' },
];

export const cities = [
  'Jakarta Utara', 'Jakarta Selatan', 'Jakarta Barat', 'Jakarta Timur', 'Jakarta Pusat',
  'Tangerang', 'Tangerang Selatan', 'Bekasi', 'Bogor', 'Depok',
  'Bandung', 'Surabaya', 'Semarang', 'Yogyakarta', 'Bali',
];
