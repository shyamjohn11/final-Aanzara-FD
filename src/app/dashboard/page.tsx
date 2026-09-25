import DashboardChrome from "@/app/components/Dashboard/DashboardChrome";
import Hero from "@/app/components/Dashboard/Hero";
import ShopByCategory from "@/app/components/Dashboard/ShopByCategory";
import PopularBrands from "@/app/components/Dashboard/PopularBrands";
import PopularProducts from "@/app/components/Dashboard/PopularProducts";
import BusinessBulkOrders from "@/app/components/Dashboard/BusinessBulkOrders";
import IndustrySolutions from "@/app/components/Dashboard/IndustrySolutions";
import Testimonials from "@/app/components/Dashboard/Testimonials";
import NewsletterCentered from "@/app/components/Dashboard/NewsletterCentered";
import Footer from "@/app/components/Footer";

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <DashboardChrome />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-10">
        <Hero />
        <ShopByCategory />
        <PopularBrands />
        <PopularProducts />
        <BusinessBulkOrders />
        <IndustrySolutions />
        <Testimonials />
        <NewsletterCentered />
      </main>

      <Footer />
    </div>
  );
}
