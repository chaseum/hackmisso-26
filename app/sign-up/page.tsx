import { AuthFooter, AuthForm } from "@/components/client";
import { AuthCard } from "@/components/site";
import { Container } from "@/components/ui";

export default function SignUpPage() {
  return (
    <main className="py-16 sm:py-24">
      <Container className="max-w-xl">
        <AuthCard title="Create your workspace" description="Set up a team-ready starter with project notes, structured sections, and a protected dashboard." footer={<AuthFooter mode="sign-up" />}>
          <AuthForm mode="sign-up" />
        </AuthCard>
      </Container>
    </main>
  );
}
