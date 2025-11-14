import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Activity, Heart, Moon, TrendingUp } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-primary relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen text-center">
        <div className="max-w-4xl animate-fade-in-up">
          <div className="mb-8 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full text-white/90 text-sm font-medium">
            <Activity className="w-4 h-4" />
            Privacy-First • No Data Storage
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Your Year in
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Health Wrapped
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
            Transform your Apple Health data into a beautiful, shareable story. 
            Discover insights, celebrate milestones, and share your health journey.
          </p>

          <Button
            size="lg"
            onClick={() => navigate("/upload")}
            className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 h-auto rounded-full font-semibold shadow-2xl hover:shadow-3xl transition-all hover:scale-105"
          >
            Get Started →
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 hover:bg-white/15 transition-all animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Your Stats</h3>
              <p className="text-white/70 text-sm">
                Steps, workouts, sleep, heart rate, and more - all beautifully visualized
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 hover:bg-white/15 transition-all animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Fun Insights</h3>
              <p className="text-white/70 text-sm">
                Creative comparisons and achievements that make your data meaningful
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 hover:bg-white/15 transition-all animate-fade-in" style={{ animationDelay: "0.6s" }}>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Moon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Fully Private</h3>
              <p className="text-white/70 text-sm">
                All processing happens in your browser. Your data never leaves your device
              </p>
            </div>
          </div>
        </div>

        <div className="mt-20 text-white/60 text-sm">
          <p>Compatible with Apple Health Export • Works entirely offline</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
