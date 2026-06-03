import React, { useState } from 'react';
import { User, Lock, Mail, ArrowRight, Code2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await axios.post('/api/login', { email, password });
      if (response.data.success) {
        toast.success(`Welcome, ${response.data.user.name}!`);
        navigate('/catalog');
      }
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Network Error: Cannot connect to Backend');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md bg-[rgba(30,28,32,0.95)] border border-white/5 p-8 rounded-3xl shadow-xl relative overflow-hidden">
        {/* Glow effect bubble */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-orange/20 to-transparent"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-brand-textMain mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-brand-textMuted text-sm">Sign in to sync your hybrid library</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-textMuted mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-brand-border bg-brand-darkBg px-4 py-3 pl-10 text-sm text-brand-textMain placeholder-brand-textMuted focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange transition-all duration-200"
                />
                <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-brand-textMuted" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-textMuted mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-brand-border bg-brand-darkBg px-4 py-3 pl-10 text-sm text-brand-textMain placeholder-brand-textMuted focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange transition-all duration-200"
                />
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-brand-textMuted" />
              </div>
              <div className="flex justify-end mt-2">
                <Link to="#" className="text-xs text-brand-orange hover:underline font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2 rounded-xl bg-brand-orange hover:bg-brand-accent px-4 py-3.5 text-sm font-bold text-white shadow-neon hover:shadow-neon-hover transition-all duration-200 group ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
              {!isSubmitting && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-between">
            <hr className="w-full border-brand-border/80" />
            <span className="px-3 text-xs text-brand-textMuted uppercase tracking-wider font-semibold">or</span>
            <hr className="w-full border-brand-border/80" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" className="flex items-center justify-center gap-2 rounded-xl border border-brand-border bg-brand-darkBg px-4 py-2.5 text-sm font-medium text-brand-textMain hover:border-brand-textMuted hover:bg-brand-cardBg transition-all duration-200">
              <Code2 className="h-4.5 w-4.5" /> GitHub
            </button>
            <button type="button" className="flex items-center justify-center gap-2 rounded-xl border border-brand-border bg-brand-darkBg px-4 py-2.5 text-sm font-medium text-brand-textMain hover:border-brand-textMuted hover:bg-brand-cardBg transition-all duration-200">
              <User className="h-4.5 w-4.5 text-blue-400" /> Google
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-brand-textMuted">
            Don't have an account?{' '}
            <Link to="#" className="text-brand-orange hover:underline font-semibold transition-colors">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
