import { PageContainer } from "@/components/layout/PageContainer";
import { SettingsView } from "@/components/settings/SettingsView";
import { getAuthenticatedBusiness } from "@/lib/auth/session";
import { isRazorpayConfigured } from "@/lib/razorpay/client";

export default async function SettingsPage() {
  const { business, user } = await getAuthenticatedBusiness();

  return (
    <PageContainer>
      <SettingsView
        businessName={business.name}
        ownerName={business.owner_name}
        email={user.email ?? ""}
        razorpayConnected={isRazorpayConfigured()}
      />
    </PageContainer>
  );
}
