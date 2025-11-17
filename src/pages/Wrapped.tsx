import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, Palette } from "lucide-react";
import { HealthMetrics } from "@/lib/healthParser";
import StoryCard from "@/components/StoryCard";
import { toast } from "sonner";
import html2canvas from "html2canvas";

type Theme = "sunset" | "ocean" | "forest";

const themes = {
  sunset: {
    gradient: "bg-sunset-gradient",
    name: "Sunset",
  },
  ocean: {
    gradient: "bg-ocean-gradient",
    name: "Deep Ocean",
  },
  forest: {
    gradient: "bg-forest-gradient",
    name: "Forest",
  },
} as const;

const ACCENTS: Record<
  Theme,
  { warm: string; glow: string; cool: string; love: string; calm: string }
> = {
  sunset: {
    warm: "#C84747FF",
    glow: "#EC8A72FF",
    cool: "#FF6262FF",
    love: "#FB7185",
    calm: "#FDA160FF",
  },
  ocean: {
    warm: "#7DD3FC",
    glow: "#38BDF8",
    cool: "#93C5FD",
    love: "#60A5FA",
    calm: "#6ED9E7FF",
  },
  forest: {
    warm: "#A7F3D0",
    glow: "#86EFAC",
    cool: "#BBF7D0",
    love: "#6EE7B7",
    calm: "#A7F3D0",
  },
};

const CARD_TO_ACCENT_KEY: Record<
  string,
  keyof (typeof ACCENTS)["sunset"]
> = {
  intro: "glow",
  insights: "glow",
  steps: "warm",
  energy: "glow",
  heart: "love",
  workouts: "warm",
  sleep: "cool",
  mindful: "calm",
};

const Wrapped = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const healthData = location.state?.healthData as HealthMetrics | undefined;

  const [currentCard, setCurrentCard] = useState(0);
  const [theme, setTheme] = useState<Theme>(
    (localStorage.getItem("hw_theme") as Theme) || "sunset"
  );
  const [showThemePicker, setShowThemePicker] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!healthData) navigate("/upload");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards = [
    { type: "intro", title: "Your Year in Health" },
    { type: "steps", title: "Steps", data: healthData?.steps },
    { type: "energy", title: "Active Energy", data: healthData?.activeEnergy },
    { type: "workouts", title: "Workouts", data: healthData?.workouts },
    { type: "sleep", title: "Sleep", data: healthData?.sleep },
    { type: "heart", title: "Heart Rate", data: healthData?.heartRate },
    { type: "mindful", title: "Mindful Minutes", data: healthData?.mindfulMinutes },
    { type: "insights", title: "Top Insights", data: healthData?.insights },
  ];

  const nextCard = () => {
    setCurrentCard((i) => Math.min(i + 1, cards.length - 1));
  };

  const prevCard = () => {
    setCurrentCard((i) => Math.max(i - 1, 0));
  };

  useEffect(() => {
    localStorage.setItem("hw_theme", theme);
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextCard();
      if (e.key === "ArrowLeft") prevCard();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const swipeStart = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    swipeStart.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (swipeStart.current === null) return;
    const delta = e.changedTouches[0].clientX - swipeStart.current;
    if (Math.abs(delta) > 48) {
      delta < 0 ? nextCard() : prevCard();
    }
    swipeStart.current = null;
  };

  const handleExport = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        width: 1080,
        height: 1920,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `health-wrapped-${cards[currentCard].type}.png`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success("Image downloaded!");
        }
      });
    } catch (error) {
      console.error("Error exporting card:", error);
      toast.error("Failed to export card");
    }
  };

  if (!healthData) return null;

  const current = cards[currentCard];
  const activeAccent =
    ACCENTS[theme][CARD_TO_ACCENT_KEY[current.type] || "glow"];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {showThemePicker && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowThemePicker(false)}
        >
          <div
            className="bg-card rounded-3xl p-8 max-w-md w-full animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold mb-6">Choose Theme</h3>
            <div className="space-y-4">
              {(Object.keys(themes) as Theme[]).map((themeKey) => (
                <button
                  key={themeKey}
                  onClick={() => {
                    setTheme(themeKey);
                    setShowThemePicker(false);
                    toast.success(`Theme changed to ${themes[themeKey].name}`);
                  }}
                  className={`w-full p-6 rounded-2xl ${themes[themeKey].gradient} text-white font-semibold text-lg hover:scale-105 transition-transform ${
                    theme === themeKey ? "ring-4 ring-white" : ""
                  }`}
                >
                  {themes[themeKey].name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-center">
        <Button
          variant="secondary"
          onClick={() => navigate("/")}
          className="bg-black/20 backdrop-blur-sm"
        >
          ← Home
        </Button>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setShowThemePicker(true)}
            className="bg-black/20 backdrop-blur-sm"
            title="Change theme"
          >
            <Palette className="w-5 h-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleExport}
            className="bg-black/20 backdrop-blur-sm"
            title="Export as PNG"
          >
            <Download className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className="relative max-w-md w-full"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {currentCard > 0 && (
            <Button
              variant="secondary"
              size="icon"
              onClick={prevCard}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 z-20 bg-black/20 backdrop-blur-sm"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}

          {currentCard < cards.length - 1 && (
            <Button
              variant="secondary"
              size="icon"
              onClick={nextCard}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 z-20 bg-black/20 backdrop-blur-sm"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          )}

          <div ref={cardRef}>
            <StoryCard card={current} theme={theme} healthData={healthData} />
          </div>

          <div className="flex justify-center gap-2 mt-4">
            {cards.map((c, index) => (
              <button
                key={index}
                onClick={() => setCurrentCard(index)}
                className={`h-2 rounded-full transition-all`}
                style={{
                  width: index === currentCard ? 32 : 8,
                  background: activeAccent,
                }}
                aria-label={`Go to ${c.title}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-1 left-0 right-0 text-center text-muted-foreground text-sm">
        <p>Use arrow keys, click arrows, or swipe to navigate</p>
      </div>
    </div>
  );
};

export default Wrapped;
