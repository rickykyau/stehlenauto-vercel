import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign in",
  // Auth gateway shouldn't be in Google's index (Priya F-3).
  robots: { index: false, follow: true },
};

export default function SignInPage() {
  return (
    <main
      className="container-x"
      style={{
        paddingTop: 48,
        paddingBottom: 96,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: 24, maxWidth: 460 }}>
        <div
          className="eyebrow"
          style={{ color: "var(--color-primary)", marginBottom: 8 }}
        >
          ACCOUNT
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 36,
            letterSpacing: "-0.01em",
            textTransform: "uppercase",
            lineHeight: 1.05,
          }}
        >
          SIGN IN TO YOUR
          <br />
          STEHLEN ACCOUNT
        </h1>
        <p
          style={{
            color: "var(--color-muted)",
            marginTop: 10,
            fontSize: 14,
          }}
        >
          Track orders, manage your garage, and keep your fitment data with you.
        </p>
      </header>
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#f5a823",
            colorBackground: "#141414",
            colorText: "#ffffff",
            colorInputBackground: "#1f1f1f",
            colorInputText: "#ffffff",
            colorTextSecondary: "#cfcfcf",
            colorTextOnPrimaryBackground: "#0a0a0a",
            colorDanger: "#ef4444",
            colorSuccess: "#22c55e",
            borderRadius: "6px",
            fontFamily: "var(--font-sans)",
            fontSize: "14px",
          },
          elements: {
            // Hide the Clerk-instance-name header ("Sign in to stehlenauto-clerk"
            // — Mike F-13 cycle-3) and use our own header above instead.
            header: { display: "none" },
            card: {
              background: "#141414",
              border: "1px solid #2a2a2a",
              boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
              padding: "28px 32px",
            },
            socialButtonsBlockButton: {
              background: "#1f1f1f",
              borderColor: "#2a2a2a",
              color: "#ffffff",
            },
            socialButtonsBlockButtonText: { color: "#ffffff" },
            dividerLine: { background: "#2a2a2a" },
            dividerText: { color: "#cfcfcf" },
            formFieldLabel: { color: "#ffffff", fontWeight: 600 },
            formFieldInput: {
              background: "#1f1f1f",
              borderColor: "#2a2a2a",
              color: "#ffffff",
            },
            formButtonPrimary: {
              background: "#f5a823",
              color: "#0a0a0a",
              fontWeight: 700,
              "&:hover": { background: "#d99315" },
            },
            footer: {
              background: "#141414",
              borderTop: "1px solid #2a2a2a",
            },
            footerActionText: { color: "#cfcfcf" },
            footerActionLink: { color: "#f5a823", fontWeight: 600 },
            identityPreviewText: { color: "#ffffff" },
            identityPreviewEditButton: { color: "#f5a823" },
            formFieldHintText: { color: "#cfcfcf" },
            formFieldErrorText: { color: "#ef4444" },
            formFieldSuccessText: { color: "#22c55e" },
            otpCodeFieldInput: {
              background: "#1f1f1f",
              borderColor: "#2a2a2a",
              color: "#ffffff",
            },
            badge: { background: "#1f1f1f", color: "#cfcfcf" },
          },
        }}
      />
    </main>
  );
}
