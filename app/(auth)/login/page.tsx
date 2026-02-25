"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Chrome } from 'lucide-react';
import Logo from '@/public/Amara_Logo.png';
import { LoginLeftPanel } from '@/components/ui/LoginLeftPanel';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);

  const { toast } = useToast();
  const router = useRouter();
  const { data: session, status } = useSession();

  // If already logged in → redirect based on role
  React.useEffect(() => {
    if (status === 'authenticated' && session?.user?.role) {
      const role = session.user.role;

      if (role === 'client') {
        router.push('/client/home');
      } else if (role === 'service_provider') {
        router.push('/provider/dashboard');
      } else if (role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/client/home');
      }
    }
  }, [status, session, router]);

  const handleCredentialsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // On success, session will update → useEffect above will redirect
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    await signIn('google', { callbackUrl: '/client/home' });
  };

  // Register is not implemented with NextAuth yet (you can add later)
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: 'Register',
      description: 'Registration with email/password is not implemented yet. Use Google for now.',
      variant: 'default',
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Visual / Branding side */}
      <LoginLeftPanel />

      {/* Right - Form side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-[#F9F7F5]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-8">
              <Image src={Logo} alt="Amara Logo" className="w-24 h-24 rounded-2xl shadow-xl" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">Amara Beauty Parlour</h1>
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center lg:text-left">
            {mode === 'login' ? 'Welcome back!' : 'Create your account'}
          </h2>
          <p className="text-gray-600 mb-8 text-center lg:text-left">
            {mode === 'login'
              ? 'Sign in to access your beauty services'
              : 'Join Amara and discover premium care'}
          </p>

          {/* Mode switcher */}
          <div className="flex bg-[#F9F7F5] shadow-lg rounded-xl p-1.5 mb-8 w-full mx-auto lg:mx-0">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium transition-all ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] text-white shadow-md'
                  : 'text-gray-700 hover:bg-transparent cursor-pointer'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium transition-all ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] text-white shadow-md'
                  : 'text-gray-700 hover:bg-transparent cursor-pointer'
              }`}
            >
              Register
            </button>
          </div>

          {mode === 'login' ? (
            <>
              {/* Google Sign In Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full mb-6 flex items-center justify-center gap-3 border border-gray-300 hover:bg-gray-100"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  'Signing in...'
                ) : (
                  <>
                    <Chrome size={20} />
                    Sign in with Google
                  </>
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-[#F9F7F5] px-4 text-gray-500">or continue with email</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="hello@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <button type="button" className="text-sm text-[#e5849c] hover:underline">
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] hover:brightness-90 text-white py-6 text-lg font-medium shadow-lg hover:shadow-lg transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? 'Please wait...' : 'Sign In'}
                </Button>
              </form>
            </>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              {/* Register fields */}
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="hello@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] hover:brightness-90 text-white py-6 text-lg font-medium shadow-lg hover:shadow-lg transition-all"
                disabled={isLoading}
              >
                {isLoading ? 'Please wait...' : 'Create Account'}
              </Button>
            </form>
          )}

          <div className="mt-8 text-center text-sm text-gray-600">
            {mode === 'login' ? (
              <>
                New here?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-[#e5849c] font-medium hover:underline"
                >
                  Create account
                </button>
              </>
            ) : (
              <>
                Already a member?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-[#e5849c] font-medium hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </div>

          {/* Demo hint */}
          <div className="mt-10 pt-6 border-t border-gray-200 text-xs text-gray-500 text-center">
            <strong>Demo accounts:</strong> admin@salon.com • provider@salon.com • client@salon.com
            <br />
            Password: <strong>password</strong>
          </div>
        </div>
      </div>
    </div>
  );
}