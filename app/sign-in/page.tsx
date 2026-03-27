import { AuthFooter, AuthForm } from "@/components/client";
import { AuthCard } from "@/components/site";
import { Container } from "@/components/ui";

export default function SignInPage() {
  return (
    <main className="py-16 sm:py-24">
      <Container className="max-w-xl">
        <AuthCard title="Welcome back" description="Sign in to continue editing your project, notes, and demo narrative." footer={<AuthFooter mode="sign-in" />}>
          <AuthForm mode="sign-in" />
        </AuthCard>
      </Container>
    </main>
  );
}
