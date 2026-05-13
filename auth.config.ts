import type { NextAuthConfig } from "next-auth";

// Edge Runtime 互換の設定（Prisma等のNode.js専用モジュールを含まない）
// middleware.ts から参照するためここに分離する
export const authConfig: NextAuthConfig = {
  providers: [],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
};
