export interface UserRecord {
  id: number;
  uid: string;
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'provider' | 'admin' | string;
  status: string;
  location: string;
  preferredLanguage: 'en' | 'kn' | string;
}

export interface UserProfile {
  id: number;
  userId: number;
  profileType: string;
  interests: string;
  preferredLocation: string;
  qualification: string;
  experience: string;
  bio: string;
  onboardingCompleted: boolean;
}

export interface UserPreferences {
  id: number;
  userId: number;
  jobAlerts: boolean;
  internshipAlerts: boolean;
  courseAlerts: boolean;
  freeTrainingAlerts: boolean;
  apprenticeshipAlerts: boolean;
  sportsAlerts: boolean;
  flexibleWorkAlerts: boolean;
  savedCategoryAlerts: boolean;
  emailOptIn: boolean;
  whatsappOptIn: boolean;
}

export interface ProviderRecord {
  id: number;
  userId: number;
  providerType: 'Individual' | 'Organization' | string;
  name: string;
  category: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  locality: string;
  city: string;
  description: string;
  verificationStatus: 'Pending Verification' | 'Verified' | 'Rejected' | 'Suspended' | string;
  lastVerifiedDate?: string | null;
  isSample: boolean;
  activeListingsCount?: number;
  createdAt: string;
}

export interface OpportunityRecord {
  id: number;
  providerId: number;
  providerName?: string;
  providerCategory?: string;
  providerVerification?: string;
  provider?: ProviderRecord;
  categorySlug: 'learn' | 'earn' | 'grow' | 'connect' | string;
  subcategory: string;
  title: string;
  description: string;
  requirements: string;
  eligibility: string;
  opportunityType: string;
  mode: string;
  locality: string;
  city: string;
  feeOrSalary: string;
  feeType: string;
  duration: string;
  timings: string;
  ageGroup: string;
  qualification: string;
  experience: string;
  instructorOrCoach?: string;
  contactPhone: string;
  contactEmail: string;
  status: 'pending' | 'active' | 'paused' | 'rejected' | 'expired' | string;
  verificationStatus: string;
  isFeatured: boolean;
  isSponsored: boolean;
  isSample: boolean;
  viewsCount: number;
  lastVerifiedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  isSaved?: boolean;
  hasApplied?: boolean;
}

export interface ApplicationRecord {
  id: number;
  userId: number;
  opportunityId: number;
  opportunityTitle?: string;
  opportunityCategory?: string;
  providerName?: string;
  applicantName: string;
  applicantPhone: string;
  qualification: string;
  coverNote: string;
  resumeLabel?: string;
  status: string;
  createdAt: string;
}

export interface EnquiryRecord {
  id: number;
  userId?: number | null;
  opportunityId?: number | null;
  opportunityTitle?: string | null;
  providerId?: number | null;
  providerName?: string | null;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  subject: string;
  message: string;
  status: string;
  replyNote?: string;
  createdAt: string;
}

export interface NotificationRecord {
  id: number;
  userId: number;
  title: string;
  message: string;
  category: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ReportRecord {
  id: number;
  opportunityId: number;
  opportunityTitle?: string;
  providerName?: string;
  reason: string;
  details: string;
  status: string;
  adminNote?: string;
  createdAt: string;
}

export const RAICHUR_LOCALITIES = [
  'Station Road',
  'Lingasugur Road',
  'Jawahar Nagar',
  'Nijalingappa Colony',
  'Industrial Growth Centre',
  'District Stadium Road',
  'Mantralayam Road',
  'Chandramouleswara Circle',
  'Sindhanur Road',
];
