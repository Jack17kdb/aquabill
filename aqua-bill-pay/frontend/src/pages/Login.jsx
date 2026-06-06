import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/auth.store.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, token, user } = useAuthStore();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const formRef = useRef(null);
  const tl = useRef(null);

  useEffect(() => {
    if (token && user) {
      navigate(user.role === 'superadmin' ? '/superadmin' : '/dashboard', { replace: true });
    }
  }, [token, user]);

  useGSAP(() => {
    tl.current = gsap.timeline()
      .from('.login-logo', { y: -30, opacity: 0, duration: 0.7, ease: 'back.out(1.4)' })
      .from('.login-card', { y: 30, opacity: 0, duration: 0.5, ease: 'power3.out' }, '-=0.5')
      .from('.login-field', { x: -20, opacity: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out' }, '-=0.35');
  }, { scope: containerRef });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success('Welcome back!');
        const dest = result.role === 'superadmin' ? '/superadmin' : '/dashboard';
        gsap.to(formRef.current, {
          scale: 0.97,
          opacity: 0,
          duration: 0.25,
          onComplete: () => navigate(dest)
        });
      } else {
        setIsSubmitting(false);
        toast.error(result.error);
        gsap.fromTo(formRef.current,
          { x: -8 },
          { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' }
        );
      }
    } catch (error) {
      setIsSubmitting(false);
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ocean-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-ocean-700/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm">
        <div className="login-logo flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-ocean-500/20 border border-ocean-500/40 flex items-center justify-center mb-4">
            <svg className="w-9 h-9 text-ocean-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z" />
            </svg>
          </div>
          <h1 className="font-display font-bold text-3xl text-white">AquaBill</h1>
          <p className="text-slate-500 text-sm mt-1">Water Billing Automation</p>
        </div>

        <div ref={formRef} className="login-card card p-6">
          <h2 className="font-display font-semibold text-lg text-white mb-6">Sign In</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="login-field">
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@property.co.ke"
                className="input-field"
                required
                autoComplete="email"
              />
            </div>

            <div className="login-field">
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary mt-2 w-full flex items-center justify-center gap-2 py-3"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
