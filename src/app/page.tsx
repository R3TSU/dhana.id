import { GetStarted } from "@/components/GetStarted";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import Image from "next/image";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    return redirect("/home");
  }

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gradient-main">
        {/* <Navbar isScrolled={isScrolled} /> */}

        {/* Hero Section */}
        <section className="relative h-screen flex items-center">
          <div
            className="absolute inset-0 z-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://dev-dhana-id.creatorcenter.id/bg.jpeg')",
              backgroundBlendMode: "overlay",
            }}
          >
            <div className="absolute inset-0 bg-dark-blue/80 backdrop-blur-sm"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10 h-full flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center animate-fade-in">
              <div className="mb-8">
                <Image
                  src="https://dev-dhana-id.creatorcenter.id/dhanaLogo.webp"
                  alt="dhanavinya.id"
                  width={300}
                  height={300}
                  className="mx-auto"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <GetStarted />
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
