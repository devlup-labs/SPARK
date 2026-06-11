import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/",
    "/dashboard",
    "/dashboard/:path*",
    "/cloud",
    "/cloud/:path*",
    "/media",
    "/media/:path*",
    "/admin",
    "/admin/:path*",
    "/devices",
    "/devices/:path*",
    "/analytics",
    "/analytics/:path*",
    "/settings",
    "/settings/:path*",
    "/apps",
    "/apps/:path*",
    "/services",
    "/services/:path*",
  ],
};
