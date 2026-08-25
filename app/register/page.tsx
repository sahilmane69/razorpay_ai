import { RegisterForm } from "@/components/auth/RegisterForm";
import { PageContainer } from "@/components/layout/PageContainer";

export default function RegisterPage() {
  return (
    <PageContainer className="py-16">
      <RegisterForm />
    </PageContainer>
  );
}
