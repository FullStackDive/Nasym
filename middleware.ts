import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // Additional checks can be added here.
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
          return !!token;
        }
        return true;
      }
    }
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/classes/:path*"]
};
