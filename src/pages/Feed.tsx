import Navbar from "@/components/Navbar";
import DiscoverySection from "@/components/feed/DiscoverySection";

const Feed = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl py-8 space-y-10">
        <DiscoverySection />
      </div>
    </div>
  );
};

export default Feed;
