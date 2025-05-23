import { GetStarted } from "@/components/GetStarted";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";

export default async function Home() {
  const { userId } = await auth();

  if ( userId ) {
    return redirect('/home');
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
            backgroundImage: "url('https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80')",
            backgroundBlendMode: "overlay",
          }}
        >
          <div className="absolute inset-0 bg-dark-blue/80 backdrop-blur-sm"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Learn Smarter, Create Better
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              Access premium educational courses designed to enhance your skills and unleash your creative potential.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
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