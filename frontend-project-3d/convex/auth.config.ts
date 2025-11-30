// Clerk authentication config for Convex
// NOTE: Set CLERK_JWT_ISSUER_DOMAIN in Convex Dashboard environment variables
// Format: https://verb-noun-00.clerk.accounts.dev

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
};
