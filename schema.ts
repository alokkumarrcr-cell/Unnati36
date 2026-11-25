import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// 1. users
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    uid: text('uid').notNull().unique(),
    email: text('email').notNull().unique(),
    name: text('name').notNull().default('UNNATI Member'),
    phone: text('phone').default(''),
    passwordHash: text('password_hash'),
    role: text('role').notNull().default('user'), // 'user' | 'provider' | 'admin'
    status: text('status').notNull().default('active'), // 'active' | 'suspended'
    location: text('location').notNull().default('Raichur, Karnataka'),
    preferredLanguage: text('preferred_language').notNull().default('en'), // 'en' | 'kn'
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('users_email_idx').on(table.email), index('users_role_idx').on(table.role)]
);

// 2. user_profiles
export const userProfiles = pgTable('user_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  profileType: text('profile_type').notNull().default('Student'), // Student, Job Seeker, Homemaker, Professional, Parent, Trainer
  interests: text('interests').notNull().default('[]'), // JSON string array
  preferredLocation: text('preferred_location').notNull().default('Raichur Town'),
  qualification: text('qualification').default(''),
  experience: text('experience').default(''),
  bio: text('bio').default(''),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. providers
export const providers = pgTable(
  'providers',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    providerType: text('provider_type').notNull().default('Organization'), // Individual | Organization
    name: text('name').notNull(),
    category: text('category').notNull(), // Tutor | Trainer | Coach | Academy | Local Business | Employer | NGO | Institution
    contactEmail: text('contact_email').notNull(),
    contactPhone: text('contact_phone').notNull(),
    address: text('address').notNull(),
    locality: text('locality').notNull().default('Station Road, Raichur'),
    city: text('city').notNull().default('Raichur, Karnataka'),
    description: text('description').notNull(),
    verificationStatus: text('verification_status').notNull().default('Pending Verification'), // Pending Verification | Verified | Rejected | Suspended
    lastVerifiedDate: timestamp('last_verified_date'),
    isSample: boolean('is_sample').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('providers_city_idx').on(table.city),
    index('providers_verification_idx').on(table.verificationStatus),
  ]
);

// 4. provider_documents
export const providerDocuments = pgTable('provider_documents', {
  id: serial('id').primaryKey(),
  providerId: integer('provider_id')
    .references(() => providers.id, { onDelete: 'cascade' })
    .notNull(),
  docType: text('doc_type').notNull(), // Registration Certificate | ID Proof | Trade License | Academy Accreditation
  docName: text('doc_name').notNull(),
  docUrl: text('doc_url').notNull(),
  status: text('status').notNull().default('submitted'), // submitted | verified | rejected
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

// 5. opportunity_categories
export const opportunityCategories = pgTable('opportunity_categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(), // learn | earn | grow | connect
  name: text('name').notNull(),
  description: text('description').notNull(),
  subcategories: text('subcategories').notNull().default('[]'),
});

// 6. opportunities
export const opportunities = pgTable(
  'opportunities',
  {
    id: serial('id').primaryKey(),
    providerId: integer('provider_id')
      .references(() => providers.id, { onDelete: 'cascade' })
      .notNull(),
    categorySlug: text('category_slug').notNull(), // learn | earn | grow | connect
    subcategory: text('subcategory').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    requirements: text('requirements').notNull().default(''),
    eligibility: text('eligibility').notNull().default('Open to local residents'),
    opportunityType: text('opportunity_type').notNull(), // Course | Job | Internship | Apprenticeship | Freelance | Sports | Workshop | Business Service
    mode: text('mode').notNull().default('In-person'), // In-person | Hybrid | Online
    locality: text('locality').notNull().default('Raichur Town'),
    city: text('city').notNull().default('Raichur, Karnataka'),
    feeOrSalary: text('fee_or_salary').notNull().default('Free'),
    feeType: text('fee_type').notNull().default('Free'), // Free | Paid | Stipend | Salary
    duration: text('duration').notNull().default('Flexible'),
    timings: text('timings').notNull().default('Morning & Evening Batches'),
    ageGroup: text('age_group').notNull().default('16+ years'),
    qualification: text('qualification').notNull().default('10th / Any'),
    experience: text('experience').notNull().default('Fresher / Beginner'),
    instructorOrCoach: text('instructor_or_coach').default(''),
    contactPhone: text('contact_phone').notNull().default(''),
    contactEmail: text('contact_email').notNull().default(''),
    status: text('status').notNull().default('pending'), // pending | active | paused | rejected | expired
    verificationStatus: text('verification_status').notNull().default('Pending Verification'), // Pending Verification | Verified | Rejected
    isFeatured: boolean('is_featured').notNull().default(false),
    isSponsored: boolean('is_sponsored').notNull().default(false),
    isSample: boolean('is_sample').notNull().default(false),
    viewsCount: integer('views_count').notNull().default(0),
    lastVerifiedAt: timestamp('last_verified_at'),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('opp_cat_idx').on(table.categorySlug),
    index('opp_status_idx').on(table.status),
    index('opp_city_idx').on(table.city),
    index('opp_provider_idx').on(table.providerId),
  ]
);

// 7. saved_opportunities
export const savedOpportunities = pgTable(
  'saved_opportunities',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    opportunityId: integer('opportunity_id')
      .references(() => opportunities.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('saved_user_opp_idx').on(table.userId, table.opportunityId)]
);

// 8. applications
export const applications = pgTable(
  'applications',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    opportunityId: integer('opportunity_id')
      .references(() => opportunities.id, { onDelete: 'cascade' })
      .notNull(),
    applicantName: text('applicant_name').notNull(),
    applicantPhone: text('applicant_phone').notNull(),
    qualification: text('qualification').notNull().default(''),
    coverNote: text('cover_note').notNull().default(''),
    resumeLabel: text('resume_label').default(''),
    status: text('status').notNull().default('submitted'), // submitted | under_review | shortlisted | accepted | rejected
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('app_user_idx').on(table.userId), index('app_opp_idx').on(table.opportunityId)]
);

// 9. enquiries
export const enquiries = pgTable(
  'enquiries',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    opportunityId: integer('opportunity_id').references(() => opportunities.id, {
      onDelete: 'set null',
    }),
    providerId: integer('provider_id').references(() => providers.id, { onDelete: 'cascade' }),
    senderName: text('sender_name').notNull(),
    senderEmail: text('sender_email').notNull(),
    senderPhone: text('sender_phone').notNull(),
    subject: text('subject').notNull(),
    message: text('message').notNull(),
    status: text('status').notNull().default('new'), // new | replied | closed
    replyNote: text('reply_note').default(''),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('enq_provider_idx').on(table.providerId)]
);

// 10. notifications
export const notifications = pgTable(
  'notifications',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    category: text('category').notNull().default('general'),
    linkUrl: text('link_url').default('/explore'),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('notif_user_idx').on(table.userId)]
);

// 11. user_preferences
export const userPreferences = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  jobAlerts: boolean('job_alerts').notNull().default(true),
  internshipAlerts: boolean('internship_alerts').notNull().default(true),
  courseAlerts: boolean('course_alerts').notNull().default(true),
  freeTrainingAlerts: boolean('free_training_alerts').notNull().default(true),
  apprenticeshipAlerts: boolean('apprenticeship_alerts').notNull().default(false),
  sportsAlerts: boolean('sports_alerts').notNull().default(false),
  flexibleWorkAlerts: boolean('flexible_work_alerts').notNull().default(true),
  savedCategoryAlerts: boolean('saved_category_alerts').notNull().default(true),
  emailOptIn: boolean('email_opt_in').notNull().default(true),
  whatsappOptIn: boolean('whatsapp_opt_in').notNull().default(false),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 12. reports
export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  reporterUserId: integer('reporter_user_id').references(() => users.id, { onDelete: 'set null' }),
  opportunityId: integer('opportunity_id')
    .references(() => opportunities.id, { onDelete: 'cascade' })
    .notNull(),
  reason: text('reason').notNull(),
  details: text('details').notNull(),
  status: text('status').notNull().default('open'), // open | investigating | resolved | dismissed
  adminNote: text('admin_note').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});

// 13. verification_requests
export const verificationRequests = pgTable('verification_requests', {
  id: serial('id').primaryKey(),
  providerId: integer('provider_id')
    .references(() => providers.id, { onDelete: 'cascade' })
    .notNull(),
  notes: text('notes').notNull().default(''),
  documentsSummary: text('documents_summary').notNull().default(''),
  status: text('status').notNull().default('Pending Verification'), // Pending Verification | Verified | Rejected
  reviewedBy: text('reviewed_by').default(''),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 14. subscriptions
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  providerId: integer('provider_id')
    .references(() => providers.id, { onDelete: 'cascade' })
    .notNull(),
  planName: text('plan_name').notNull().default('Community Free'), // Community Free | Growth Visibility | Institutional Partner
  status: text('status').notNull().default('active'), // active | cancelled | expired
  amountInr: integer('amount_inr').notNull().default(0),
  billingCycle: text('billing_cycle').notNull().default('monthly'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
});

// 15. payments
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  providerId: integer('provider_id')
    .references(() => providers.id, { onDelete: 'cascade' })
    .notNull(),
  subscriptionId: integer('subscription_id').references(() => subscriptions.id, {
    onDelete: 'set null',
  }),
  amountInr: integer('amount_inr').notNull(),
  purpose: text('purpose').notNull(),
  status: text('status').notNull().default('paid'), // paid | pending | failed
  referenceCode: text('reference_code').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 16. sponsored_listings
export const sponsoredListings = pgTable('sponsored_listings', {
  id: serial('id').primaryKey(),
  opportunityId: integer('opportunity_id')
    .references(() => opportunities.id, { onDelete: 'cascade' })
    .notNull(),
  providerId: integer('provider_id')
    .references(() => providers.id, { onDelete: 'cascade' })
    .notNull(),
  placementType: text('placement_type').notNull().default('Category Top'), // Featured Banner | Category Top | Explore Highlight
  budgetInr: integer('budget_inr').notNull().default(0),
  status: text('status').notNull().default('active'), // active | scheduled | ended
  startsAt: timestamp('starts_at').defaultNow().notNull(),
  endsAt: timestamp('ends_at'),
});

// 17. admin_activity_logs
export const adminActivityLogs = pgTable('admin_activity_logs', {
  id: serial('id').primaryKey(),
  adminUserId: integer('admin_user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: integer('target_id'),
  details: text('details').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 18. contact_messages (Contact & Partnership Enquiries)
export const contactMessages = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  topic: text('topic').notNull().default('General Enquiry'),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 19. system_settings (Admin platform settings + optional claimed admin passcode hash)
export const systemSettings = pgTable('system_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, { fields: [users.id], references: [userProfiles.userId] }),
  preferences: one(userPreferences, { fields: [users.id], references: [userPreferences.userId] }),
  providers: many(providers),
  savedOpportunities: many(savedOpportunities),
  applications: many(applications),
  notifications: many(notifications),
}));

export const providersRelations = relations(providers, ({ one, many }) => ({
  owner: one(users, { fields: [providers.userId], references: [users.id] }),
  documents: many(providerDocuments),
  opportunities: many(opportunities),
  enquiries: many(enquiries),
  verificationRequests: many(verificationRequests),
  subscriptions: many(subscriptions),
  payments: many(payments),
}));

export const opportunitiesRelations = relations(opportunities, ({ one, many }) => ({
  provider: one(providers, { fields: [opportunities.providerId], references: [providers.id] }),
  applications: many(applications),
  enquiries: many(enquiries),
  savedBy: many(savedOpportunities),
  reports: many(reports),
}));
