// "use client";

// import React, { useState } from 'react';
// import Image from 'next/image';
// import { useRouter } from 'next/navigation';
// import { signIn, useSession } from 'next-auth/react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { useToast } from '@/hooks/use-toast';
// import { Eye, EyeOff, Chrome } from 'lucide-react';
// import Logo from '@/public/Amara_Logo.png';
// import { LoginLeftPanel } from '@/components/ui/LoginLeftPanel';

// export default function AuthPage() {
//   const [mode, setMode] = useState<'login' | 'register'>('login');
//   const [email, setEmail] = useState<string>('');
//   const [password, setPassword] = useState<string>('');
//   const [name, setName] = useState<string>('');
//   const [phone, setPhone] = useState<string>('');
//   const [showPassword, setShowPassword] = useState<boolean>(false);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [googleLoading, setGoogleLoading] = useState<boolean>(false);

//   const { toast } = useToast();
//   const router = useRouter();
//   const { data: session, status } = useSession();

//   // If already logged in → redirect based on role
//   React.useEffect(() => {
//     if (status === "authenticated") {
//       const role = session?.user?.role;

//       switch (role) {
//         case "admin":
//           router.replace("/admin/dashboard");
//           break;
//         case "service_provider":
//           router.replace("/provider/dashboard");
//           break;
//         default:
//           router.replace("/client/home");
//       }
//     }
//   }, [status, session, router]);

//   const handleCredentialsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();

//     setIsLoading(true);

//     try {
//       const result = await signIn('credentials', {
//         email,
//         password,
//         redirect: false,
//       });

//       if (result?.error) {
//         throw new Error(result.error);
//       }

//       // On success, session will update → useEffect above will redirect
//       toast({
//         title: 'Welcome back!',
//         description: 'You have successfully logged in.',
//       });
//     } catch (err: any) {
//       toast({
//         title: 'Error',
//         description: err.message || 'Invalid credentials. Please try again.',
//         variant: 'destructive',
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleGoogleSignIn = async () => {
//     setGoogleLoading(true);
//     // await signIn('google', { callbackUrl: '/client/home' });
//     await signIn("google");
//   };

//   // Register is not implemented with NextAuth yet (you can add later)
//   const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     toast({
//       title: 'Register',
//       description: 'Registration with email/password is not implemented yet. Use Google for now.',
//       variant: 'default',
//     });
//   };

//   return (
//     <div className="min-h-screen flex">
//       {/* Left - Visual / Branding side */}
//       <LoginLeftPanel />

//       {/* Right - Form side */}
//       <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-[#F9F7F5]">
//         <div className="w-full max-w-md">
//           {/* Mobile logo */}
//           <div className="lg:hidden text-center mb-10">
//             <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-8">
//               <Image src={Logo} alt="Amara Logo" className="w-24 h-24 rounded-2xl shadow-xl" />
//             </div>
//             <h1 className="text-4xl font-bold text-gray-800">Amara Beauty Parlour</h1>
//           </div>

//           <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center lg:text-left">
//             {mode === 'login' ? 'Welcome back!' : 'Create your account'}
//           </h2>
//           <p className="text-gray-600 mb-8 text-center lg:text-left">
//             {mode === 'login'
//               ? 'Sign in to access your beauty services'
//               : 'Join Amara and discover premium care'}
//           </p>

//           {/* Mode switcher */}
//           <div className="flex bg-[#F9F7F5] shadow-lg rounded-xl p-1.5 mb-8 w-full mx-auto lg:mx-0">
//             <button
//               type="button"
//               onClick={() => setMode('login')}
//               className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium transition-all ${
//                 mode === 'login'
//                   ? 'bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] text-white shadow-md'
//                   : 'text-gray-700 hover:bg-transparent cursor-pointer'
//               }`}
//             >
//               Login
//             </button>
//             <button
//               type="button"
//               onClick={() => setMode('register')}
//               className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium transition-all ${
//                 mode === 'register'
//                   ? 'bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] text-white shadow-md'
//                   : 'text-gray-700 hover:bg-transparent cursor-pointer'
//               }`}
//             >
//               Register
//             </button>
//           </div>

//           {mode === 'login' ? (
//             <>
//               {/* Google Sign In Button */}
//               <Button
//                 type="button"
//                 variant="outline"
//                 className="w-full mb-6 flex items-center justify-center gap-3 border border-gray-300 hover:bg-gray-100"
//                 onClick={handleGoogleSignIn}
//                 disabled={googleLoading}
//               >
//                 {googleLoading ? (
//                   'Signing in...'
//                 ) : (
//                   <>
//                     <Chrome size={20} />
//                     Sign in with Google
//                   </>
//                 )}
//               </Button>

//               <div className="relative my-6">
//                 <div className="absolute inset-0 flex items-center">
//                   <div className="w-full border-t border-gray-300" />
//                 </div>
//                 <div className="relative flex justify-center text-sm">
//                   <span className="bg-[#F9F7F5] px-4 text-gray-500">or continue with email</span>
//                 </div>
//               </div>

//               {/* Email/Password Form */}
//               <form onSubmit={handleCredentialsSubmit} className="space-y-5">
//                 <div>
//                   <Label htmlFor="email">Email address</Label>
//                   <Input
//                     id="email"
//                     type="email"
//                     placeholder="hello@example.com"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     required
//                     className="mt-1.5"
//                   />
//                 </div>

//                 <div>
//                   <Label htmlFor="password">Password</Label>
//                   <div className="relative mt-1.5">
//                     <Input
//                       id="password"
//                       type={showPassword ? 'text' : 'password'}
//                       placeholder="••••••••"
//                       value={password}
//                       onChange={(e) => setPassword(e.target.value)}
//                       required
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowPassword(!showPassword)}
//                       className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
//                     >
//                       {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                     </button>
//                   </div>
//                 </div>

//                 <div className="text-right">
//                   <button type="button" className="text-sm text-[#e5849c] hover:underline">
//                     Forgot password?
//                   </button>
//                 </div>

//                 <Button
//                   type="submit"
//                   className="w-full bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] hover:brightness-90 text-white py-6 text-lg font-medium shadow-lg hover:shadow-lg transition-all"
//                   disabled={isLoading}
//                 >
//                   {isLoading ? 'Please wait...' : 'Sign In'}
//                 </Button>
//               </form>
//             </>
//           ) : (
//             <form onSubmit={handleRegister} className="space-y-5">
//               {/* Register fields */}
//               <div>
//                 <Label htmlFor="name">Full Name</Label>
//                 <Input
//                   id="name"
//                   placeholder="Priya Sharma"
//                   value={name}
//                   onChange={(e) => setName(e.target.value)}
//                   required
//                   className="mt-1.5"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="phone">Phone Number</Label>
//                 <Input
//                   id="phone"
//                   type="tel"
//                   placeholder="+91 98765 43210"
//                   value={phone}
//                   onChange={(e) => setPhone(e.target.value)}
//                   required
//                   className="mt-1.5"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="email">Email address</Label>
//                 <Input
//                   id="email"
//                   type="email"
//                   placeholder="hello@example.com"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   required
//                   className="mt-1.5"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="password">Password</Label>
//                 <div className="relative mt-1.5">
//                   <Input
//                     id="password"
//                     type={showPassword ? 'text' : 'password'}
//                     placeholder="••••••••"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     required
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
//                   >
//                     {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                   </button>
//                 </div>
//               </div>

//               <Button
//                 type="submit"
//                 className="w-full bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] hover:brightness-90 text-white py-6 text-lg font-medium shadow-lg hover:shadow-lg transition-all"
//                 disabled={isLoading}
//               >
//                 {isLoading ? 'Please wait...' : 'Create Account'}
//               </Button>
//             </form>
//           )}

//           <div className="mt-8 text-center text-sm text-gray-600">
//             {mode === 'login' ? (
//               <>
//                 New here?{' '}
//                 <button
//                   type="button"
//                   onClick={() => setMode('register')}
//                   className="text-[#e5849c] font-medium hover:underline"
//                 >
//                   Create account
//                 </button>
//               </>
//             ) : (
//               <>
//                 Already a member?{' '}
//                 <button
//                   type="button"
//                   onClick={() => setMode('login')}
//                   className="text-[#e5849c] font-medium hover:underline"
//                 >
//                   Sign in
//                 </button>
//               </>
//             )}
//           </div>

//           {/* Demo hint */}
//           <div className="mt-10 pt-6 border-t border-gray-200 text-xs text-gray-500 text-center">
//             <strong>Demo accounts:</strong> admin@salon.com • provider@salon.com • client@salon.com
//             <br />
//             Password: <strong>password</strong>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { authAPI } from "@/lib/api";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import Logo from '@/public/Amara_Logo.png';
import { LoginLeftPanel } from '@/components/ui/LoginLeftPanel';
import { FcGoogle } from "react-icons/fc";
import { Suspense } from 'react';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "admin@amarago.com";

async function getRedirectPath(user: User): Promise<string> {
  if (user.email === ADMIN_EMAIL) return "/admin";
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const role = snap.data()?.role;
      if (role === "admin") return "/admin";
      if (role === "service_provider" || role === "pending_sp") return "/provider";
    }
  } catch {
    // fallback to client if Firestore fails
  }
  return "/client/home";
}

async function setSessionCookie(token: string): Promise<void> {
  const res = await fetch("/api/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error || "Session creation failed");
  }
}

function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const isRegistering = React.useRef(false);

  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? null;

  // ── SINGLE unified auth effect ──────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Skip redirect while registration flow is in progress — we handle it manually
      if (isRegistering.current) return;
      if (user) {
        try {
          const token = await user.getIdToken();
          await setSessionCookie(token);
        } catch {
          // cookie may already be valid
        }
        const path = await getRedirectPath(user);
        router.replace(redirectTo ?? path);
      } else {
        setAuthChecking(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // ── Email / Password login ──────────────────────────────────────────────────
  const handleCredentialsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const token = await user.getIdToken();
      await setSessionCookie(token);
      toast({ title: 'Welcome back!', description: 'You have successfully logged in.' });
      const path = await getRedirectPath(user);
      router.replace(redirectTo ?? path);
    } catch (error: any) {
      setFormError(friendlyError(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Email / Password register ───────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    isRegistering.current = true; // prevent onAuthStateChanged from redirecting mid-flow
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // Update Firebase displayName so it's visible everywhere
      const { updateProfile } = await import('firebase/auth');
      await updateProfile(user, { displayName: name });

      const token = await user.getIdToken();
      await setSessionCookie(token);

      // Register user profile in backend (idempotent — safe to call on every register)
      await authAPI.registerClient({
        name,
        email: user.email ?? email,
        phone,
        firebase_uid: user.uid,
        id_token: token,
      });

      toast({ title: 'Account created!', description: 'Welcome to AmaraGo.' });
      router.replace('/client/home');
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: friendlyError(error.code),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      isRegistering.current = false;
    }
  };

  // ── Google sign-in ──────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const { user } = await signInWithPopup(auth, provider);
      const token = await user.getIdToken();
      await setSessionCookie(token);

      // Register in backend if first time (idempotent — backend checks existence)
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (!userSnap.exists()) {
        await authAPI.registerClient({
          name: user.displayName ?? "",
          email: user.email ?? "",
          phone: "",
          firebase_uid: user.uid,
          id_token: token,
        });
      }

      toast({ title: 'Welcome!', description: `Signed in as ${user.displayName ?? user.email}` });
      const path = await getRedirectPath(user);
      router.replace(path);
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          title: 'Google Sign-in failed',
          description: friendlyError(error.code),
          variant: 'destructive',
        });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Forgot password ─────────────────────────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address first to reset your password.",
        variant: "destructive",
      });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Reset link sent ✅",
        description: `A password reset link has been sent to ${email}. Please check your inbox.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to send reset link",
        description: friendlyError(error.code),
        variant: "destructive",
      });
    }
  };

  if (authChecking) return null;

  return (
    <div className="h-screen flex overflow-hidden">
      <LoginLeftPanel />

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-8 bg-[#F9F7F5]">
        <div className="w-full max-w-md max-h-screen overflow-y-auto">

          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-8">
              <Image src={Logo} alt="Amara Logo" className="w-24 h-24 rounded-2xl shadow-xl" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">AmaraGo</h1>
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center lg:text-left">
            {mode === 'login' ? 'Welcome back!' : 'Create your account'}
          </h2>
          <p className="text-gray-600 mb-8 text-center lg:text-left">
            {mode === 'login'
              ? 'Sign in to access your beauty services'
              : 'Join Amara and discover premium care'}
          </p>

          <div className="flex bg-[#F9F7F5] shadow-lg rounded-xl p-1.5 mb-8">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium transition-all capitalize ${
                  mode === m
                    ? 'bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] text-white shadow-md'
                    : 'text-gray-700 hover:bg-transparent cursor-pointer'
                }`}
              >
                {m === 'login' ? 'Login' : 'Register'}
              </button>
            ))}
          </div>

          {mode === 'login' ? (
            <>
              <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                <Field label="Email address" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    placeholder="hello@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setFormError(null); }}
                    required
                    className="mt-1.5"
                  />
                </Field>

                <Field label="Password" htmlFor="password">
                  <PasswordInput
                    value={password}
                    onChange={(value) => { setPassword(value); setFormError(null); }}
                    show={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                    error={!!formError}
                  />
                  {formError && (
                    <p className="text-sm text-red-500 mt-1">{formError}</p>
                  )}
                </Field>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-[#e5849c] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <SubmitButton loading={isLoading} label="Sign In" loadingLabel="Signing in…" />
              </form>

              <Divider />

              <Button
                type="button"
                variant="outline"
                className="w-full mb-4 flex items-center justify-center gap-3 border border-gray-300 bg-white hover:bg-gray-50"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  "Signing in…"
                ) : (
                  <>
                    <FcGoogle size={20} />
                    Sign in with Google
                  </>
                )}
              </Button>
            </>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <Field label="Full Name" htmlFor="name">
                <Input
                  id="name"
                  placeholder="Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </Field>

              <Field label="Phone Number" htmlFor="phone">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </Field>

              <Field label="Email address" htmlFor="reg-email">
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="hello@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </Field>

              <Field label="Password" htmlFor="reg-password">
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  show={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                />
              </Field>

              <SubmitButton loading={isLoading} label="Create Account" loadingLabel="Creating…" />
            </form>
          )}

          <div className="mt-8 text-center text-sm text-gray-600">
            {mode === 'login' ? (
              <>New here?{' '}
                <button type="button" onClick={() => setMode('register')} className="text-[#e5849c] font-medium hover:underline">
                  Create account
                </button>
              </>
            ) : (
              <>Already a member?{' '}
                <button type="button" onClick={() => setMode('login')} className="text-[#e5849c] font-medium hover:underline">
                  Sign in
                </button>
              </>
            )}
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => router.push('/client/home')}
              className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
            >
              Browse as guest
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-[#F9F7F5] px-4 text-gray-500">or continue with google</span>
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function PasswordInput({
  value, onChange, show, onToggle, error = false,
}: {
  value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; error?: boolean;
}) {
  return (
    <div className="relative mt-1.5">
      <Input
        type={show ? 'text' : 'password'}
        placeholder="••••••••"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

function SubmitButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <Button
      type="submit"
      className="w-full bg-gradient-to-r from-[#e5849c] to-[#E5AFBC] hover:brightness-90 text-white py-6 text-lg font-medium shadow-lg transition-all"
      disabled={loading}
    >
      {loading ? loadingLabel : label}
    </Button>
  );
}

function friendlyError(code: string): string {
  const map: Record<string, string> = {
    'auth/invalid-credential':     'Invalid email or password.',
    'auth/user-not-found':         'No account found with this email.',
    'auth/wrong-password':         'Incorrect password.',
    'auth/email-already-in-use':   'An account with this email already exists.',
    'auth/weak-password':          'Password must be at least 6 characters.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/too-many-requests':      'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-blocked':          'Popup was blocked. Please allow popups for this site.',
  };
  return map[code] ?? 'Something went wrong. Please try again.';
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <AuthPage />
        </Suspense>
    );
}