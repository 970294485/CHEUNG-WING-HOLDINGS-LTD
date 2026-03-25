import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getAuthSecretKey } from "@/lib/auth/secret";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("tvp_session")?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  try {
    const { payload } = await jwtVerify(token, getAuthSecretKey());
    
    // RBAC: Check permissions based on path (example)
    const permissions = Array.isArray(payload.permissions) ? payload.permissions : [];
    const path = request.nextUrl.pathname;
    
    // If user has "manage:all", allow everything
    const isAdmin = permissions.includes("manage:all");
    
    // Temporarily disable RBAC checks so all pages can be opened
    /*
    if (!isAdmin) {
      console.log("User is not admin. Path:", path, "Permissions:", permissions);
      if (path.startsWith("/accounting") && !permissions.includes("read:accounting")) {
        console.log("Forbidden: accounting");
        return new NextResponse("Forbidden: Missing read:accounting permission", { status: 403 });
      }
      if (path.startsWith("/sales") && !permissions.includes("read:sales")) {
        console.log("Forbidden: sales");
        return new NextResponse("Forbidden: Missing read:sales permission", { status: 403 });
      }
      // Add more fine-grained checks as needed
    } else {
      console.log("User is admin. Path:", path);
    }
    */

    return NextResponse.next();
  } catch {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/financial/:path*",
    "/accounting/:path*",
    "/sales/:path*",
    "/exports/:path*",
    "/files/:path*",
    "/customers/:path*",
    "/data-entry/:path*",
    "/products/:path*",
  ],
};
