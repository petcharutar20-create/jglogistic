import NextAuth from "next-auth"
import LineProvider from "next-auth/providers/line"
import { prisma } from "@/lib/prisma"
import type { Role } from "@/generated/prisma/enums"
import type { DefaultSession } from "next-auth"

export const { handlers, auth, signIn, signOut } = NextAuth({
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
      if (account?.provider === "line" && account.providerAccountId) {
        const lineUserId = account.providerAccountId

        let dbUser = await prisma.user
          .findUnique({ where: { lineUserId } })
          .catch(() => null)

        if (!dbUser) {
          dbUser = await prisma.user
            .create({
              data: {
                name: user?.name,
                image: user?.image,
                lineUserId,
                role: "DRIVER",
              },
            })
            .catch(() => null)
        }

        if (dbUser) {
          token.userId = dbUser.id
          token.role = dbUser.role
          token.lineUserId = lineUserId
        }
      } else if (token.userId) {
        // Refresh role from DB on every token refresh so role changes take effect immediately
        const dbUser = await prisma.user
          .findUnique({ where: { id: token.userId as string }, select: { role: true } })
          .catch(() => null)
        if (dbUser) token.role = dbUser.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId as string) ?? ""
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
