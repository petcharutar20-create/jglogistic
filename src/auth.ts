import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import LineProvider from "next-auth/providers/line"
import { prisma } from "@/lib/prisma"
import type { Role } from "@/generated/prisma/enums"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, lineUserId: true },
        })
        session.user.role = dbUser?.role ?? "DRIVER"
        session.user.lineUserId = dbUser?.lineUserId ?? null
      }
      return session
    },
    async signIn({ user, account }) {
      if (account?.provider === "line" && account.providerAccountId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lineUserId: account.providerAccountId },
        }).catch(() => null)
      }
      return true
    },
  },
  pages: {
    signIn: "/login",
  },
})

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      lineUserId: string | null
    } & DefaultSession["user"]
  }
}

import type { DefaultSession } from "next-auth"
