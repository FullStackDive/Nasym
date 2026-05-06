import { withAuth } from "next-auth/middleware";

/**
 * Route-level role guards. Authenticated users by default for matched paths;
 * specific path prefixes require specific roles. Unauth → redirected to /auth/signin.
 */
export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname;

      if (path.startsWith("/admin")) {
        return token?.role === "ADMIN";
      }
      if (path.startsWith("/teach")) {
        return token?.role === "TEACHER" || token?.role === "ADMIN";
      }
      if (path.startsWith("/parent")) {
        return token?.role === "PARENT" || token?.role === "ADMIN";
      }

      // Other matched paths: any signed-in user.
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/teach/:path*",
    "/parent/:path*",
    "/lessons/:path*",
    "/classes/:path*",
    "/classroom/:path*",
    "/profile/:path*",
    "/reminders/:path*",
    "/reports/:path*",
  ],
};
