// // import { NextAuthOptions } from 'next-auth';
// // import GoogleProvider from 'next-auth/providers/google';
// // import CredentialsProvider from 'next-auth/providers/credentials';
// // import { FirestoreAdapter } from '@next-auth/firebase-adapter';
// // import { cert } from 'firebase-admin/app';
// // import { adminDb } from '@/lib/firebaseAdmin';
// // import { signInWithEmailAndPassword } from 'firebase/auth';
// // import { auth } from '@/lib/firebase';
// // import { doc, getDoc } from 'firebase/firestore';
// // import { db } from '@/lib/firebase';

// // export const authOptions: NextAuthOptions = {
// //   adapter: FirestoreAdapter({
// //     credential: cert({
// //       projectId:   process.env.FIREBASE_PROJECT_ID!,
// //       clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
// //       privateKey:  process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
// //     }),
// //   }),

// //   providers: [
// //     GoogleProvider({
// //       clientId:     process.env.GOOGLE_CLIENT_ID!,
// //       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
// //     }),

// //     CredentialsProvider({
// //       name: 'Credentials',
// //       credentials: {
// //         email:    {},
// //         password: {},
// //       },
// //       async authorize(credentials) {
// //         try {
// //           // Firebase Auth handles password verification
// //           const userCredential = await signInWithEmailAndPassword(
// //             auth,
// //             credentials!.email,
// //             credentials!.password
// //           );
// //           const firebaseUser = userCredential.user;

// //           // Get role from Firestore
// //           const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
// //           const role = userDoc.data()?.role ?? 'client';

// //           return {
// //             id:    firebaseUser.uid,
// //             email: firebaseUser.email!,
// //             name:  firebaseUser.displayName ?? '',
// //             role, 
// //           };
// //         } catch {
// //           return null;
// //         }
// //       },
// //     }),
// //   ],

// //   session: { strategy: 'jwt' as const },

// //   callbacks: {
// //     async jwt({ token, user }) {
// //       if (user) {
// //         token.role = (user as any).role;
// //         token.id   = user.id;
// //       }
// //       return token;
// //     },
// //     async session({ session, token }) {
// //       if (session.user) {
// //         session.user.role = token.role as string;
// //         session.user.id   = token.id   as string;
// //       }
// //       return session;
// //     },
// //   },

// //   pages: { signIn: '/login' },
// //   secret: process.env.NEXTAUTH_SECRET,
// // };


// import { NextAuthOptions } from "next-auth";
// import GoogleProvider from "next-auth/providers/google";
// import { db } from "@/lib/firebaseAdmin";

// export const authOptions: NextAuthOptions = {
//   providers: [
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID!,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//     }),
//   ],

//   session: {
//     strategy: "jwt",
//   },

//   callbacks: {
//     async signIn({ user }) {
//       console.log("SIGNIN CALLBACK RUNNING", user);

//       if (!user.email) return false;

//       const userRef = db.collection("users").doc(user.email);
//       const doc = await userRef.get();

//       if (!doc.exists) {
//         console.log("CREATING NEW USER");

//         await userRef.set({
//           name: user.name,
//           email: user.email,
//           image: user.image,
//           role: "client",
//           createdAt: new Date(),
//         });
//       }

//       return true;
//     }
//   },

//   secret: process.env.NEXTAUTH_SECRET,
// };