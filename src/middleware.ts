import { withAuth } from "next-auth/middleware"

export default withAuth({
    pages: {
        signIn: "/login",
    },
})

export const config = {
    matcher: [
        "/",
        "/scheduled",
        "/accounts",
        "/settings",
        "/api/generate",
        "/api/post",
        "/api/schedule"
    ]
}
