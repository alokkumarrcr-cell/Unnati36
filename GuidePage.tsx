import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    group: '01. Public Discovery & Category Portals',
    desc: 'Open to all residents of Raichur without requiring login. Browse skills, jobs, sports, and verified local providers.',
    items: [
      {
        name: 'Home',
        route: '/home',
        purpose: 'Raichur Pilot hero, live search bar with suggestions, live database statistics, and category previews.',
      },
      {
        name: 'Explore',
        route: '/explore',
        purpose: 'Unified search engine with Raichur locality selector, fee/salary filters, mode, qualification, grid/list switch, and pagination.',
      },
      {
        name: 'Learn',
        route: '/learn',
        purpose: 'Coding, computer courses, ITI training, tailoring, embroidery, beauty wellness, digital marketing, and Govt/NGO programmes.',
      },
      {
        name: 'Earn',
        route: '/earn',
        purpose: 'Full-time, part-time, internships, apprenticeships, fieldwork, freelancing, and work-from-home openings.',
      },
      {
        name: 'Grow',
        route: '/grow',
        purpose: 'Badminton, cricket, chess, football, athletics, classical music, dance, drawing, yoga, and martial arts batches.',
      },
      {
        name: 'Connect',
        route: '/connect',
        purpose: 'Verified local directory of tutors, coaches, academies, employers, NGOs, and institutions with dedicated profile pages.',
      },
      {
        name: 'About & Contact & Pricing',
        route: '/about',
        purpose: 'Raichur pilot vision, partnership contact form, visibility pricing plans, and legal governance pages.',
      },
    ],
  },
  {
    group: '02. Authenticated User Dashboard',
    desc: 'Free personalized workspace for students, job seekers, homemakers, professionals, and parents.',
    items: [
      {
        name: 'Onboarding Wizard',
        route: '/onboarding',
        purpose: '5-step guided setup: user type, interests, Raichur locality, notification preferences, and completion.',
      },
      {
        name: 'Dashboard Overview',
        route: '/dashboard',
        purpose: 'Welcome summary, personalized Raichur recommendations, saved counts, application and enquiry snapshots.',
      },
      {
        name: 'My Applications & Saved Items',
        route: '/dashboard/applications',
        purpose: 'Track submitted applications (submitted, shortlisted, accepted) and bookmarked opportunities.',
      },
      {
        name: 'Notifications & Settings',
        route: '/dashboard/notifications',
        purpose: 'Read/unread alerts, opt-in notification preferences, and English / Kannada language switch.',
      },
    ],
  },
  {
    group: '03. Provider Portal',
    desc: 'Dedicated workspace for Raichur tutors, academies, coaches, local businesses, employers, and NGOs.',
    items: [
      {
        name: 'Provider Registration',
        route: '/provider/register',
        purpose: 'Onboard an Individual or Organization profile with locality details and verification document reference.',
      },
      {
        name: 'Create Dynamic Listing',
        route: '/provider/create-listing',
        purpose: 'Adaptive form changing fields for Jobs, Courses, Sports, or Business Services. Submits into Pending Approval.',
      },
      {
        name: 'Manage Listings & Enquiries',
        route: '/provider/manage-listings',
        purpose: 'Pause, resume, renew, or delete listings, reply to user enquiries, and track listing view analytics.',
      },
      {
        name: 'Verification & Subscriptions',
        route: '/provider/verification',
        purpose: 'Request manual verification independently from optional visibility plans (paid plans never buy verification).',
      },
    ],
  },
  {
    group: '04. Admin Control Center',
    desc: 'Protected moderation & governance console backed by PostgreSQL audit logs.',
    items: [
      {
        name: 'Admin Overview & Analytics',
        route: '/admin/dashboard',
        purpose: 'Live platform totals, category engagement charts, and recent admin activity logs.',
      },
      {
        name: 'Listing Approvals & Featured',
        route: '/admin/approvals',
        purpose: 'Approve or reject pending listings, mark featured/sponsored placements, or remove misleading entries.',
      },
      {
        name: 'Provider & User Management',
        route: '/admin/providers',
        purpose: 'Review uploaded verification documents, verify or suspend providers, and manage user roles.',
      },
      {
        name: 'Reports & Platform Settings',
        route: '/admin/reports',
        purpose: 'Investigate community complaints, configure default launch city (Raichur) and expansion districts.',
      },
    ],
  },
];

export function GuidePage() {
  return (
    <div className="px-4 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto space-y-8">
      <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 sm:p-8">
        <div className="text-xs font-semibold text-[#145C43] mb-1">
          Platform Architecture · Section Guide
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#202820]">
          Which Section Is What in UNNATI
        </h1>
        <p className="text-sm text-[#78847D] mt-2 max-w-3xl leading-relaxed">
          UNNATI is organized as a multi-portal, tab-driven platform rather than a single scrolling page. Use this directory to jump directly to any Public, User, Provider, or Admin workspace and inspect the loaded Raichur Sample Pilot records.
        </p>

        <div className="mt-5 p-4 rounded-xl bg-[#F8F8F2] border border-[#E6EAE6] text-xs text-[#202820] space-y-1">
          <div className="font-semibold text-[#145C43]">Loaded Sample Pilot Data Summary</div>
          <p className="text-[#78847D]">
            8 Raichur providers (7 Verified, 1 Pending Verification) · 18 opportunities across Learn, Earn, and Grow (16 Active, 2 Pending Admin Approval) · Sample applications, enquiries, notifications, an open moderation report, and visibility plans. All demonstration records are clearly labelled Sample Pilot.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {SECTIONS.map((sec) => (
          <section key={sec.group} className="space-y-3">
            <div>
              <h2 className="font-display text-lg font-bold text-[#202820]">{sec.group}</h2>
              <p className="text-xs text-[#78847D]">{sec.desc}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sec.items.map((item) => (
                <Link
                  key={item.route}
                  to={item.route}
                  className="group bg-[#FFFFFF] border border-[#E6EAE6] rounded-xl p-5 flex items-start justify-between gap-4 hover:border-[#145C43]/50 transition-colors"
                >
                  <div>
                    <div className="font-display text-sm font-bold text-[#202820] group-hover:text-[#145C43]">
                      {item.name}
                    </div>
                    <div className="font-mono-num text-[11px] text-[#42A875] mt-0.5">
                      {item.route}
                    </div>
                    <p className="text-xs text-[#78847D] mt-1.5 leading-relaxed">{item.purpose}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#78847D] group-hover:text-[#145C43] shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
