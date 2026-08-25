import { LoginForm } from "@/components/auth/LoginForm";
import { PageContainer } from "@/components/layout/PageContainer";

export default function LoginPage() {
  return (
    <PageContainer className="py-16">
      <LoginForm />
    </PageContainer>
  );
}
