export interface User {
  id: number;
  user_image?: string | null;
  userRole: number;
  username: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  address1?: string | null;
  address2?: string | null;
  cityId?: number | null;
  stateId?: number | null;
  countryId?: number | null;
  zipcode?: string | null;
  qrCode?: string | null;
  status: number;
  is_deleted?: number;
  terms_accepted?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
