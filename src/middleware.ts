import { NextResponse, type NextRequest } from "next/server";

// Optional password for the deployed app. There are no accounts, so without this
// anyone with the URL can call the server actions and change your progress.
// Set APP_PASSWORD to turn it on (the browser asks once; any username works).
// Left unset, everything stays open, exactly as before.
export function middleware(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();

  const [scheme, encoded] = (req.headers.get("authorization") ?? "").split(" ");
  if (scheme === "Basic" && encoded) {
    const credentials = atob(encoded);
    if (credentials.slice(credentials.indexOf(":") + 1) === password) return NextResponse.next();
  }
  return new NextResponse("Password required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="frenchapp", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon).*)"],
};
