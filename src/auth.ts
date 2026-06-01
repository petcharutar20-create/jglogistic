import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import LineProvider from "next-auth/providers/line"
import { prisma } from "@/lib/prisma"
import type { Role } from "@/generated/prisma/enums"
import type { DefaultSession } from "next-auth"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user?.id) {
        token.id = user.id
      }
      if (account?.provider === "line") {
        token.lineUserId = account.providerAccountId
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        }).catch(() => null)
        token.role = dbUser?.role ?? "DRIVER"
        // save lineUserId to user record
        await prisma.user.update({
          where: { id: token.id as string },
          data: { lineUserId: account.providerAccountId },
        }).catch(() => null)
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = (token.role as Role) ?? "DRIVER"
        session.user.lineUserId = (token.lineUserId as string) ?? null
      }
      return session
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
