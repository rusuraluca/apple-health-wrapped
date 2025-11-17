import {
  Activity,
  Heart,
  Moon,
  TrendingUp,
  Brain,
  Flame,
  Footprints,
  MapPin,
  Zap,
  Award,
  Calendar,
  Sun,
  Trophy,
  Timer,
  Sparkles,
} from "lucide-react";
import { HealthMetrics } from "@/lib/healthParser";
import { useState, useEffect, useMemo } from "react";

type Theme = "sunset" | "ocean" | "forest";
type CardKey =
  | "intro"
  | "steps"
  | "energy"
  | "workouts"
  | "sleep"
  | "heart"
  | "mindful"
  | "insights";

interface StoryCardProps {
  card: {
    type: string;
    title: string;
    data?: any;
  };
  theme: Theme;
  healthData: HealthMetrics;
}

const THEME_PALETTES = {
  sunset: {
    stops: [
      ["#FF8A00", "#FF512F"], // 0 intro / insights
      ["#FF512F", "#DD2476"], // 1 steps
      ["#FC466B", "#FB613FFF"], // 2 energy/heart
      ["#FFD200", "#F7971E"], // 3 workouts
      ["#F95361FF", "#EEB045FF"], // 4 sleep/mindful
      ["#F43B47", "#944A3AFF"], // 5 spare
    ],
    accents: {
      warm: "#FDE047", // yellow-400
      glow: "#F59E0B", // amber-500
      cool: "#FFB367FF", // blue-300
      love: "#FB7371FF", // rose-400
      calm: "#EF724FFF", // violet-400
    },
  },
  ocean: {
    stops: [
      ["#00C6FF", "#0072FF"], // 0 intro / insights
      ["#2ABBF5FF", "#009EFD"], // 1 steps
      ["#00D2FF", "#3A7BD5"], // 2 energy/heart
      ["#43A2CEFF", "#185A9D"], // 3 workouts
      ["#3A7BD5", "#3A6073"], // 4 sleep/mindful
      ["#0F2027", "#203A43"], // 5 spare
    ],
    accents: {
      warm: "#7DD3FC", // sky-300
      glow: "#38BDF8", // sky-400
      cool: "#93C5FD", // blue-300
      love: "#60A5FA", // blue-400
      calm: "#6ED9E7FF",
    },
  },
  forest: {
    stops: [
      ["#11998E", "#38EF7D"], // 0 intro / insights
      ["#00B09B", "#96C93D"], // 1 steps
      ["#56AB2F", "#A8E063"], // 2 energy/heart
      ["#2C3E50", "#4CA1AF"], // 3 workouts
      ["#013220", "#21A179"], // 4 sleep/mindful
      ["#0F9B0F", "#8BC34A"], // 5 spare
    ],
    accents: {
      warm: "#A7F3D0", // green-200
      glow: "#86EFAC", // green-300
      cool: "#BBF7D0", // lime-200
      love: "#6EE7B7",
      calm: "#A7F3D0", // green-200
    },
  },
} as const;

const CARD_TO_GRADIENT_INDEX: Record<CardKey, number> = {
  intro: 0,
  insights: 0,
  steps: 1,
  energy: 2,
  heart: 2,
  workouts: 3,
  sleep: 4,
  mindful: 4,
};

const CARD_TO_ACCENT: Record<
  CardKey,
  keyof (typeof THEME_PALETTES)["sunset"]["accents"]
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

function gradientCSS(from: string, to: string) {
  return `
    radial-gradient(1200px 600px at 10% 0%, ${to}33, transparent 60%),
    radial-gradient(1200px 600px at 90% 100%, ${from}33, transparent 60%),
    linear-gradient(135deg, ${from} 0%, ${to} 100%)
  `;
}

function withAlpha(hex: string, alpha: number) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const StoryCard = ({ card, theme, healthData }: StoryCardProps) => {
  const [isVisible, setIsVisible] = useState(false);

  const cardKey = useMemo(
    () =>
      ([
        "intro",
        "steps",
        "energy",
        "workouts",
        "sleep",
        "heart",
        "mindful",
        "insights",
      ] as CardKey[]).includes(card.type as CardKey)
        ? (card.type as CardKey)
        : "intro",
    [card.type]
  );

  const { bgStyle, accent } = useMemo(() => {
    const palette = THEME_PALETTES[theme];
    const [from, to] =
      palette.stops[CARD_TO_GRADIENT_INDEX[cardKey]] ?? palette.stops[0];
    const accentKey = CARD_TO_ACCENT[cardKey];
    const acc = palette.accents[accentKey];
    return {
      bgStyle: { background: gradientCSS(from, to) } as React.CSSProperties,
      accent: acc,
    };
  }, [theme, cardKey]);

  useEffect(() => {
    setIsVisible(false);
    const t = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(t);
  }, [card.type]);

  const renderCardContent = () => {
    switch (card.type as CardKey) {
      case "intro":
        return (
          <div className="relative flex flex-col items-center justify-center h-full px-8 overflow-hidden">
            <div className="absolute inset-0" style={bgStyle} />
            <div className="absolute inset-0 opacity-30">
              {[...Array(80)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-white"
                  style={{
                    width: Math.random() * 3 + 1 + "px",
                    height: Math.random() * 3 + 1 + "px",
                    top: Math.random() * 100 + "%",
                    left: Math.random() * 100 + "%",
                    animation: `float ${Math.random() * 8 + 6}s ease-in-out infinite`,
                    animationDelay: Math.random() * 4 + "s",
                    opacity: Math.random() * 0.7 + 0.3,
                  }}
                />
              ))}
            </div>
            <div
              className={`relative z-10 text-center transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
            >
              <div className="mb-8 animate-float">
                <Activity
                  className="w-28 h-28 mx-auto text-white opacity-90"
                  strokeWidth={1.5}
                />
              </div>
              <h1 className="text-8xl font-black mb-4 text-white tracking-tighter text-shadow-glow">
                2025
              </h1>
              <h2 className="text-6xl font-black mb-6 text-white tracking-tight">
                Health Wrapped
              </h2>
              <div
                className="w-40 h-1.5 rounded-full mx-auto mb-8 animate-shimmer"
                style={{
                  background:
                    "linear-gradient(90deg, #fff, rgba(255,255,255,.25), #fff)",
                  backgroundSize: "200% 100%",
                }}
              />
              <p className="text-2xl text-white/90 font-medium">
                Your year of transformation
              </p>
              <div className="mt-12 flex gap-2 justify-center">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-white animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case "steps": {
        const totalSteps = card.data.total;
        const avgSteps = card.data.average;
        const kmWalked = (totalSteps * 0.00075).toFixed(0);
        const equivalentMarathons = (parseFloat(kmWalked) / 42.195).toFixed(1);
        return (
          <div
            className={`relative flex flex-col h-full p-8 overflow-hidden transition-all duration-500 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0" style={bgStyle} />
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'url("data:image/svg+xml,%3Csvg width=\\"60\\" height=\\"60\\" viewBox=\\"0 0 60 60\\" xmlns=\\"http://www.w3.org/2000/svg\\">%3Cg fill=\\"none\\" fill-rule=\\"evenodd\\">%3Cg fill=\\"%23ffffff\\" fill-opacity=\\"1\\">%3Cpath d=\\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                }}
              />
            </div>

            <div className="relative z-10 flex-1 flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <div className="glass-card rounded-2xl p-4 animate-bounce-slow">
                  <Footprints className="w-10 h-10 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">Steps</h3>
                  <p className="text-white/80 text-sm">
                    Every journey begins with a single step
                  </p>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center space-y-6">
                <div className="text-center">
                  <div className="inline-block glass-card-strong rounded-3xl">
                    <div className="text-7xl font-black text-white tracking-tighter text-shadow-glow">
                      {(totalSteps / 1_000_000).toFixed(2)}M
                    </div>
                  </div>
                  <p className="text-2xl text-white/90 font-bold">
                    total steps conquered
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card rounded-3xl p-5">
                    <Calendar className="w-6 h-6 text-white/80 mb-2" />
                    <p className="text-sm text-white/70 mb-1">Daily average</p>
                    <p className="text-3xl font-black text-white">
                      {avgSteps.toLocaleString()} steps
                    </p>
                  </div>

                  <div className="glass-card rounded-3xl p-5">
                    <MapPin className="w-6 h-6 text-white/80 mb-2" />
                    <p className="text-sm text-white/70 mb-1">Distance</p>
                    <p className="text-3xl font-black text-white">{kmWalked} km</p>
                  </div>
                </div>

                <div
                  className="glass-card-strong rounded-3xl p-6 border-2"
                  style={{ borderColor: withAlpha(accent, 0.4) }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy
                      className="w-5 h-5"
                      style={{ color: accent }}
                    />
                    <p className="text-xs text-white/80 font-semibold">
                      Marathon Equivalent
                    </p>
                  </div>
                  <p className="text-2xl text-white font-black">
                    {equivalentMarathons} marathons
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "energy": {
        const totalCal = Math.round(card.data.total);
        const avgCal = Math.round(card.data.average);
        const pizzasEquivalent = (totalCal / 285).toFixed(0);
        const lightbulbs = Math.floor(totalCal / 100);

        return (
          <div
            className={`relative flex flex-col h-full p-8 overflow-hidden transition-all duration-500 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0" style={bgStyle} />
            <div className="absolute inset-0 opacity-10">
              {[...Array(15)].map((_, i) => (
                <Zap
                  key={i}
                  className="absolute"
                  style={{
                    color: withAlpha(accent, 0.8),
                    width: Math.random() * 30 + 20 + "px",
                    height: Math.random() * 30 + 20 + "px",
                    top: Math.random() * 100 + "%",
                    left: Math.random() * 100 + "%",
                    transform: `rotate(${Math.random() * 360}deg)`,
                    animation: `glow ${Math.random() * 2 + 1}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 flex-1 flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <div className="glass-card rounded-2xl p-4 animate-pulse-slow">
                  <Flame
                    className="w-10 h-10 text-white"
                    strokeWidth={2.5}
                    fill="currentColor"
                  />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">Energy</h3>
                  <p className="text-white/80 text-sm">You're on fire!</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <div className="text-center">
                  <div className="inline-block glass-card-strong rounded-3xl">
                    <div className="text-7xl font-black text-white tracking-tighter text-shadow-glow">
                      {(totalCal / 1000).toFixed(1)}K
                    </div>
                  </div>
                  <p className="text-2xl text-white/90 font-bold">
                    active calories burned
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass-card rounded-3xl p-5">
                    <Timer className="w-6 h-6 text-white/80 mb-2" />
                    <p className="text-sm text-white/70 mb-1">Daily burn rate</p>
                    <p className="text-4xl font-black text-white">{avgCal}</p>
                  </div>
                  <div className="glass-card rounded-3xl p-5">
                    <p className="w-6 h-6 text-white/80 mb-2">🍕</p>
                    <p className="text-sm text-white/70 mb-1">Pizza equivalent</p>
                    <p className="text-4xl font-black text-white">
                      {pizzasEquivalent}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div
                    className="glass-card-strong rounded-3xl p-5 border-2"
                    style={{ borderColor: withAlpha(accent, 0.4) }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Zap
                        className="w-6 h-6 animate-pulse"
                        style={{ color: accent }}
                      />
                      <p className="text-xs font-bold uppercase" style={{ color: withAlpha(accent, 0.9) }}>
                        Power Output
                      </p>
                    </div>
                    <p className="text-xl text-white font-bold mb-2">
                      💡 {lightbulbs} lightbulbs powered
                    </p>
                    <p className="text-white/70 text-sm">
                      That's enough to light up a whole neighborhood!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "workouts": {
        const totalWorkouts = card.data.total;
        const totalMinutes = Math.round(card.data.totalMinutes);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const daysOfWorkout = (totalMinutes / 1440).toFixed(1);
        const topWorkout = Object.entries(card.data.types || {}).sort(
          ([, a], [, b]) => (b as number) - (a as number)
        )[0] as [string, number] | undefined;

        return (
          <div
            className={`relative flex flex-col h-full p-8 overflow-hidden transition-all duration-500 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0" style={bgStyle} />
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, white 1.5px, transparent 1.5px)",
                  backgroundSize: "30px 30px",
                }}
              />
            </div>

            <div className="relative z-10 flex-1 flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <div className="glass-card rounded-2xl p-4">
                  <TrendingUp className="w-10 h-10 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">Workouts</h3>
                  <p className="text-white/80 text-sm">Consistency is key</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center space-y-6">
                <div className="text-center">
                  <div className="inline-block glass-card-strong rounded-3xl">
                    <div className="text-7xl font-black text-white tracking-tighter text-shadow-glow">
                      {totalWorkouts}
                    </div>
                  </div>
                  <p className="text-2xl text-white/90 font-bold">
                    sessions completed
                  </p>
                </div>

                <div className="text-center glass-card-strong rounded-3xl">
                  <div className="flex items-baseline justify-center gap-3 mb-3">
                    <div className="text-center">
                      <span className="text-6xl font-black text-white">{hours}</span>
                      <span className="text-lg text-white/80 ml-1">hrs</span>
                    </div>
                    <span className="text-4xl font-bold text-white/60">:</span>
                    <div className="text-center">
                      <span className="text-6xl font-black text-white">{mins}</span>
                      <span className="text-lg text-white/80 ml-1">min</span>
                    </div>
                  </div>
                  <p className="text-white/60 text-sm text-center">
                    That's {daysOfWorkout} full days dedicated to fitness!
                  </p>
                </div>
                {topWorkout && (
                  <div
                    className="glass-card-strong rounded-3xl p-6 border-2"
                    style={{ borderColor: withAlpha(accent, 0.4) }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="w-6 h-6" style={{ color: accent }} />
                      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: withAlpha(accent, 0.9) }}>
                        Top Activity
                      </p>
                    </div>
                    <p className="text-3xl text-white font-black mb-2">
                      {topWorkout[0].replace("HKWorkoutActivityType", "")}
                    </p>
                    <p className="text-lg text-white/80">{topWorkout[1]} sessions</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      case "sleep": {
        const avgHours = card.data.averageHours;
        const totalHours = Math.round(card.data.totalHours);
        const sleepScore = Math.round((avgHours / 9) * 100);
        const sleepQuality =
          avgHours >= 7 ? "Elite" : avgHours >= 6 ? "Solid" : "Needs Work";
        const qualityEmoji = avgHours >= 7 ? "🌟" : avgHours >= 6 ? "💤" : "😴";

        return (
          <div
            className={`relative flex flex-col h-full p-8 overflow-hidden transition-all duration-500 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0" style={bgStyle} />
            <div className="absolute inset-0 opacity-30">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute text-3xl"
                  style={{
                    top: Math.random() * 100 + "%",
                    left: Math.random() * 100 + "%",
                    animation: `glow ${Math.random() * 4 + 2}s ease-in-out infinite`,
                    animationDelay: Math.random() * 3 + "s",
                  }}
                >
                  ⭐
                </div>
              ))}
            </div>

            <div className="relative z-10 flex-1 flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <div className="glass-card rounded-2xl p-4">
                  <Moon className="w-10 h-10 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">Sleep</h3>
                  <p className="text-white/80 text-sm">Rest & recover</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center space-y-6">
                <div className="text-center">
                  <div className="inline-block glass-card-strong rounded-3xl">
                    <div className="text-7xl font-black text-white tracking-tighter text-shadow-glow">
                      {avgHours}h
                    </div>
                  </div>
                  <p className="text-2xl text-white/90 font-bold">
                    average nightly rest
                  </p>
                </div>

                <div
                  className="glass-card-strong rounded-3xl p-6 border-2"
                  style={{ borderColor: withAlpha(accent, 0.4) }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Sun className="w-7 h-7" style={{ color: accent }} />
                      <p className="text-sm text-white/90 font-bold">
                        Sleep Quality
                      </p>
                    </div>
                    <span className="text-3xl">{qualityEmoji}</span>
                  </div>
                  <p className="text-5xl text-white font-black mb-2">
                    {sleepQuality}
                  </p>
                  <div className="mt-4 bg-white/20 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full transition-all duration-1000"
                      style={{
                        width: `${sleepScore}%`,
                        background: `linear-gradient(90deg, ${withAlpha(
                          accent,
                          0.6
                        )}, ${accent})`,
                      }}
                    />
                  </div>
                  <p className="text-white/70 text-sm mt-2 text-right">
                    {sleepScore}/100
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "heart": {
        const avgBpm = card.data.average;
        const restingBpm = card.data.resting;
        const totalBeats = Math.round(avgBpm * 60 * 24 * 365);
        const beatsPerDay = Math.round(avgBpm * 60 * 24);
        const heartHealth =
          restingBpm < 60 ? "Athletic 🏃" : restingBpm < 70 ? "Excellent 💪" : "Good ✨";
        const heartRateVariability = restingBpm > 0 ? avgBpm - restingBpm : 0;

        return (
          <div
            className={`relative flex flex-col h-full p-8 overflow-hidden transition-all duration-500 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0" style={bgStyle} />
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border-4 border-white rounded-full animate-ping"
                style={{ animationDuration: "2s" }}
              />
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border-4 border-white rounded-full animate-ping"
                style={{ animationDuration: "2s", animationDelay: "0.5s" }}
              />
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-4 border-white rounded-full animate-ping"
                style={{ animationDuration: "2s", animationDelay: "1s" }}
              />
            </div>

            <div className="relative z-10 flex-1 flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <div className="glass-card rounded-2xl p-4 animate-pulse">
                  <Heart
                    className="w-10 h-10 text-white"
                    strokeWidth={2.5}
                    fill="currentColor"
                  />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">Heart</h3>
                  <p className="text-white/80 text-sm">Your engine of life</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center space-y-6">
                {restingBpm > 0 && (
                  <div
                    className="glass-card-strong rounded-3xl p-6 border-2"
                    style={{ borderColor: withAlpha(accent, 0.4) }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-white/70 text-sm">Resting heart rate</p>
                      <div className="glass-card rounded-xl px-4 py-2">
                        <p className="text-white font-black text-sm">{heartHealth}</p>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-6xl font-black text-white">{restingBpm}</span>
                      <span className="text-xl text-white/80">bpm</span>
                    </div>
                    {heartRateVariability > 0 && (
                      <p className="text-white/60 text-xs">
                        ⬆️ {heartRateVariability} bpm variability during activity
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card rounded-3xl p-5">
                    <p className="text-white/70 text-xs mb-2">Beats in 2025</p>
                    <p className="text-3xl text-white font-black">
                      {(totalBeats / 1_000_000).toFixed(1)}M
                    </p>
                  </div>

                  <div className="glass-card rounded-3xl p-5">
                    <p className="text-white/70 text-xs mb-2">Daily beats</p>
                    <p className="text-3xl text-white font-black">
                      {(beatsPerDay / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-5 text-center">
                  <p className="text-white/80 text-sm leading-relaxed">
                    💓 Your heart beat{" "}
                    <span className="font-bold text-white">
                      {(totalBeats / 1_000_000).toFixed(1)} million times
                    </span>{" "}
                    to keep you moving this year
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "mindful": {
        const totalMindful = Math.round(card.data.total);
        const sessions = card.data.sessions;
        const avgSession = sessions > 0 ? Math.round(totalMindful / sessions) : 0;
        const mindfulHours = (totalMindful / 60).toFixed(1);

        return (
          <div
            className={`relative flex flex-col h-full p-8 overflow-hidden transition-all duration-500 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0" style={bgStyle} />
            <div className="absolute inset-0">
              <div className="absolute inset-0 opacity-10">
                {[...Array(40)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-white rounded-full"
                    style={{
                      top: Math.random() * 100 + "%",
                      left: Math.random() * 100 + "%",
                      animation: `float ${Math.random() * 5 + 4}s ease-in-out infinite`,
                      animationDelay: Math.random() * 4 + "s",
                      transform: `scale(${Math.random() * 1.5 + 0.5})`,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <div className="glass-card rounded-2xl p-4 animate-float">
                  <Brain className="w-10 h-10 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">Mindfulness</h3>
                  <p className="text-white/80 text-sm">Peace & presence</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center space-y-6">
                <div className="text-center">
                  <div className="inline-block glass-card-strong rounded-3xl">
                    <div className="text-7xl font-black text-white tracking-tighter text-shadow-glow">
                      {totalMindful}
                    </div>
                  </div>
                  <p className="text-2xl text-white/90 font-bold">
                    minutes of inner peace
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card-strong rounded-3xl p-5">
                    <Sparkles className="w-6 h-6 text-white/80 mb-2" />
                    <p className="text-xs text-white/70 mb-1">Sessions</p>
                    <p className="text-5xl text-white font-black">{sessions}</p>
                  </div>

                  <div className="glass-card-strong rounded-3xl p-5">
                    <Timer className="w-6 h-6 text-white/80 mb-2" />
                    <p className="text-xs text-white/70 mb-1">Avg session</p>
                    <p className="text-5xl text-white font-black">{avgSession}m</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="glass-card rounded-3xl p-5">
                    <p className="text-white/70 text-xs mb-2">Total hours of calm</p>
                    <p className="text-3xl text-white font-black">
                      {mindfulHours} hours 🧘‍♀️
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "insights":
        return (
          <div
            className={`relative flex flex-col h-full p-8 overflow-hidden transition-all duration-500 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0" style={bgStyle} />
            <div className="absolute inset-0 opacity-20">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(30deg, white 12%, transparent 12.5%, transparent 87%, white 87.5%, white), linear-gradient(150deg, white 12%, transparent 12.5%, transparent 87%, white 87.5%, white)",
                  backgroundSize: "80px 140px",
                }}
              />
            </div>

            <div className="relative z-10 flex-1 flex flex-col">
              <div className="text-center mb-8">
                <div className="glass-card-strong rounded-3xl p-5 inline-block mb-4 animate-bounce-slow">
                  <Trophy className="w-14 h-14 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-4xl font-black text-white mb-2">
                  Year Highlights
                </h3>
                <p className="text-white/80 text-lg">Your 2025 achievement showcase</p>
              </div>

              <div className="flex-1 flex flex-col justify-center space-y-5">
                <div className="glass-card rounded-3xl p-6 border" style={{ borderColor: withAlpha(accent, 0.35) }}>
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="w-6 h-6" style={{ color: accent }} />
                    <p className="text-xs text-white/90 font-bold uppercase tracking-wider">
                      Workouts
                    </p>
                  </div>
                  <p className="text-xl text-white font-bold leading-tight">
                    {card.data.yearComparison}
                  </p>
                </div>

                <div className="glass-card-strong rounded-3xl p-6 border-2" style={{ borderColor: withAlpha(accent, 0.5) }}>
                  <p className="text-xs text-white/70 mb-2 uppercase tracking-wide">
                    Next chapter
                  </p>
                  <p className="text-3xl text-white font-black mb-2">2026 Awaits! 🎉</p>
                  <p className="text-white/80 text-sm">Keep pushing your limits</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-[2.5rem] shadow-2xl text-white aspect-[9/16] w-full overflow-hidden transform transition-all duration-300 hover:scale-[1.02]">
        {renderCardContent()}
      </div>
    </div>
  );
};

export default StoryCard;
