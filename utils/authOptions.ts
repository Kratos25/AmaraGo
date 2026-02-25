import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/config/database";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        try {
          await connectDB();
          console.log('DB connected');

          const user = await User.findOne({ email: credentials?.email });
          console.log('User found:', user ? user.email : 'NOT FOUND');

          if (!user) return null;

          const isValid = await bcrypt.compare(credentials!.password, user.password);
          console.log('Password valid:', isValid);

          if (!isValid) return null;

          return {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
          };
        } catch (err) {
          console.error('Auth error:', err);
          return null;
        }
      },
    }),
  ],

  session: { strategy: "jwt" as const },

  callbacks: {
    async signIn({ user, account }) {
      // Auto-create user in DB on first Google sign in
      if (account?.provider === "google") {
        await connectDB();
        const existing = await User.findOne({ email: user.email });
        if (!existing) {
          await User.create({
            email: user.email,
            name: user.name,
            role: "user",         // default role for Google users
            logintype: "google",
          });
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      // Fetch role from DB on every token refresh for Google users
      if (!token.role) {
        await connectDB();
        const dbUser = await User.findOne({ email: token.email });
        if (dbUser) token.role = dbUser.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",     // redirect to your login page
  },

  secret: process.env.NEXTAUTH_SECRET,
};