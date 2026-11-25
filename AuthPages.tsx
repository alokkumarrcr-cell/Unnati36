import React, { useState } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { RAICHUR_LOCALITIES } from '../types.ts';

const PROFILE_TYPES = [
  'Student',
  'Job Seeker',
  'Homemaker',
  'Professional',
  'Parent',
  'Trainer',
];

const INTEREST_OPTIONS = [
  'Coding & Digital Skills',
  'ITI & Solar Training',
  'Tailoring & Craft',
  'Local Full-Time Jobs',
  'Part-Time & WFH',
  'Internships & Apprenticeships',
  'Badminton & Sports',
  'Music, Dance & Yoga',
];

export function LoginPage() {
  const { loginWithGoogle, loginWithEmail } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google sign-in could not complete.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      if (forgotMode) {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setMessage(data.message);
      } else {
        await loginWithEmail(email, password);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#202820]">
            {forgotMode ? 'Reset Password' : 'Sign in to UNNATI'}
          </h1>
          <p className="text-xs text-[#78847D] mt-1">
            Access your saved opportunities, applications, and personalized Raichur dashboard.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}
        {message && (
          <div className="p-3 rounded-lg bg-[#145C43]/10 border border-[#145C43]/20 text-[#145C43] text-xs">
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl border border-[#E6EAE6] bg-[#FFFFFF] hover:bg-[#F8F8F2] text-sm font-semibold text-[#202820] flex items-center justify-center gap-2 transition-colors"
        >
          Continue with Google
        </button>

        <div className="flex items-center gap-3 text-xs text-[#78847D]">
          <div className="h-px flex-1 bg-[#E6EAE6]" />
          <span>or with email</span>
          <div className="h-px flex-1 bg-[#E6EAE6]" />
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-[#202820] mb-1">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm focus:border-[#145C43] focus:outline-none"
            />
          </div>

          {!forgotMode && (
            <div>
              <label className="block text-xs font-medium text-[#202820] mb-1">Password</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm focus:border-[#145C43] focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setForgotMode(!forgotMode)}
              className="text-[#145C43] hover:underline font-medium"
            >
              {forgotMode ? 'Back to Sign In' : 'Forgot password?'}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#145C43] text-[#FFFFFF] text-sm font-semibold hover:bg-[#0F4934] disabled:opacity-60"
          >
            {loading ? 'Please wait...' : forgotMode ? 'Request Reset Guidance' : 'Sign In'}
          </button>
        </form>

        <p className="text-xs text-center text-[#78847D]">
          New to UNNATI?{' '}
          <Link to="/register" className="text-[#145C43] font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { registerWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    location: 'Raichur, Karnataka',
    profileType: 'Student',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerWithEmail(form);
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#202820]">
            Join UNNATI Raichur
          </h1>
          <p className="text-xs text-[#78847D] mt-1">
            Essential access for learners, job seekers, homemakers, and parents is always free.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={async () => {
            try {
              await loginWithGoogle();
              navigate('/onboarding');
            } catch (err: any) {
              setError(err.message || 'Google sign-up failed.');
            }
          }}
          className="w-full py-2.5 px-4 rounded-xl border border-[#E6EAE6] bg-[#FFFFFF] hover:bg-[#F8F8F2] text-sm font-semibold text-[#202820]"
        >
          Sign up instantly with Google
        </button>

        <div className="flex items-center gap-3 text-xs text-[#78847D]">
          <div className="h-px flex-1 bg-[#E6EAE6]" />
          <span>or register with email</span>
          <div className="h-px flex-1 bg-[#E6EAE6]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Full Name</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Phone Number</label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91"
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Password (min 6 chars)</label>
            <input
              required
              minLength={6}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Profile Type</label>
              <select
                value={form.profileType}
                onChange={(e) => setForm({ ...form, profileType: e.target.value })}
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              >
                {PROFILE_TYPES.map((pt) => (
                  <option key={pt}>{pt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Location</label>
              <select
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              >
                <option value="Raichur, Karnataka">Raichur, Karnataka</option>
                {RAICHUR_LOCALITIES.map((l) => (
                  <option key={l} value={`${l}, Raichur`}>
                    {l}, Raichur
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#145C43] text-[#FFFFFF] text-sm font-semibold hover:bg-[#0F4934] disabled:opacity-60"
          >
            {loading ? 'Creating Account...' : 'Continue to Onboarding'}
          </button>
        </form>

        <p className="text-xs text-center text-[#78847D]">
          Already registered?{' '}
          <Link to="/login" className="text-[#145C43] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export function OnboardingWizardPage() {
  const { authFetch, refreshSession, user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [profileType, setProfileType] = useState('Student');
  const [interests, setInterests] = useState<string[]>(['Coding & Digital Skills', 'Local Full-Time Jobs']);
  const [preferredLocation, setPreferredLocation] = useState('Station Road, Raichur');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('Fresher');
  const [prefs, setPrefs] = useState({
    jobAlerts: true,
    internshipAlerts: true,
    courseAlerts: true,
    freeTrainingAlerts: true,
    apprenticeshipAlerts: false,
    sportsAlerts: false,
    flexibleWorkAlerts: true,
    savedCategoryAlerts: true,
    emailOptIn: true,
    whatsappOptIn: false,
  });
  const [saving, setSaving] = useState(false);

  const toggleInterest = (val: string) => {
    setInterests((prev) =>
      prev.includes(val) ? prev.filter((i) => i !== val) : [...prev, val]
    );
  };

  const completeOnboarding = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/auth/onboarding', {
        method: 'POST',
        body: JSON.stringify({
          profileType,
          interests: interests.length > 0 ? interests : ['Coding & Digital Skills'],
          preferredLocation,
          qualification,
          experience,
          preferences: prefs,
        }),
      });
      if (res.ok) {
        await refreshSession();
        navigate('/dashboard');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[#145C43]">
              Step {step} of 5 · Onboarding Wizard
            </div>
            <h1 className="font-display text-2xl font-bold text-[#202820] mt-1">
              {step === 1 && 'Select Your User Type'}
              {step === 2 && 'Select Your Interests'}
              {step === 3 && 'Preferred Raichur Locality'}
              {step === 4 && 'Notification Preferences'}
              {step === 5 && 'Ready to Explore UNNATI'}
            </h1>
          </div>
          <div className="font-mono-num text-xs text-[#78847D]">{step * 20}%</div>
        </div>

        <div className="w-full h-1.5 bg-[#E6EAE6] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#145C43] transition-all duration-200"
            style={{ width: `${step * 20}%` }}
          />
        </div>

        {step === 1 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PROFILE_TYPES.map((pt) => (
              <button
                key={pt}
                type="button"
                onClick={() => setProfileType(pt)}
                className={`p-4 rounded-xl border text-left transition-colors ${
                  profileType === pt
                    ? 'border-[#145C43] bg-[#145C43]/8 text-[#145C43] font-semibold'
                    : 'border-[#E6EAE6] text-[#202820] hover:border-[#145C43]/40'
                }`}
              >
                <div className="text-sm">{pt}</div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {INTEREST_OPTIONS.map((opt) => {
              const selected = interests.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleInterest(opt)}
                  className={`p-3 rounded-xl border text-left text-xs font-medium transition-colors flex items-center justify-between ${
                    selected
                      ? 'border-[#145C43] bg-[#145C43]/8 text-[#145C43]'
                      : 'border-[#E6EAE6] text-[#202820]'
                  }`}
                >
                  <span>{opt}</span>
                  {selected && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">Preferred Locality</label>
              <select
                value={preferredLocation}
                onChange={(e) => setPreferredLocation(e.target.value)}
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              >
                {RAICHUR_LOCALITIES.map((l) => (
                  <option key={l} value={`${l}, Raichur`}>
                    {l}, Raichur
                  </option>
                ))}
                <option value="Raichur District (Nearby Taluks)">
                  Raichur District (Nearby Taluks)
                </option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Qualification</label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g. PUC, B.Com, ITI"
                  className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Experience Level</label>
                <input
                  type="text"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g. Fresher, 1-2 years"
                  className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {[
              { key: 'jobAlerts', label: 'New local job alerts' },
              { key: 'internshipAlerts', label: 'Internship alerts' },
              { key: 'courseAlerts', label: 'New courses & workshops' },
              { key: 'freeTrainingAlerts', label: 'Free govt/NGO training' },
              { key: 'apprenticeshipAlerts', label: 'Apprenticeship alerts' },
              { key: 'sportsAlerts', label: 'Sports & cultural admissions' },
              { key: 'flexibleWorkAlerts', label: 'Flexible / Work From Home' },
              { key: 'savedCategoryAlerts', label: 'Saved category updates' },
              { key: 'emailOptIn', label: 'Email alerts (consented)' },
              { key: 'whatsappOptIn', label: 'WhatsApp updates (when enabled)' },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-[#E6EAE6] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={Boolean((prefs as any)[item.key])}
                  onChange={(e) =>
                    setPrefs({ ...prefs, [item.key]: e.target.checked })
                  }
                  className="rounded text-[#145C43]"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        )}

        {step === 5 && (
          <div className="bg-[#F8F8F2] border border-[#E6EAE6] rounded-xl p-5 space-y-2 text-xs">
            <div className="font-semibold text-[#145C43] text-sm">Summary Ready</div>
            <div>Profile Type: <strong>{profileType}</strong></div>
            <div>Location: <strong>{preferredLocation}</strong></div>
            <div>Selected Interests: <strong>{interests.join(', ')}</strong></div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="px-4 py-2 rounded-lg border border-[#E6EAE6] text-xs font-semibold disabled:opacity-40"
          >
            Previous
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(5, s + 1))}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={completeOnboarding}
              className="px-5 py-2.5 rounded-xl bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
            >
              {saving ? 'Saving...' : 'Complete Registration & Open Dashboard'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
