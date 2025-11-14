import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, CheckCircle2, Loader2 } from "lucide-react";
import { parseAppleHealthXML } from "@/lib/healthParser";
import { toast } from "sonner";

type Step = "upload" | "unzip" | "parse" | "analyze" | "generate";

const steps: { id: Step; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "unzip", label: "Unzip" },
  { id: "parse", label: "Parse" },
  { id: "analyze", label: "Analyze" },
  { id: "generate", label: "Generate" },
];

const Upload = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [processing, setProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".zip")) {
        toast.error("Please upload a .zip file from Apple Health export");
        return;
      }
      setFile(selectedFile);
    }
  };

  const processHealthData = useCallback(async () => {
    if (!file) return;

    setProcessing(true);

    try {
      // Step 1: Unzip
      setCurrentStep("unzip");
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 2: Parse
      setCurrentStep("parse");
      const healthData = await parseAppleHealthXML(file);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 3: Analyze
      setCurrentStep("analyze");
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Generate
      setCurrentStep("generate");
      await new Promise(resolve => setTimeout(resolve, 800));

      // Navigate to wrapped view with data
      navigate("/wrapped", { state: { healthData } });
    } catch (error) {
      console.error("Error processing health data:", error);
      toast.error("Failed to process health data. Please ensure you uploaded a valid Apple Health export.");
      setProcessing(false);
      setCurrentStep("upload");
    }
  }, [file, navigate]);

  const getStepStatus = (stepId: Step) => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    const stepIndex = steps.findIndex(s => s.id === stepId);

    if (stepIndex < currentIndex) return "complete";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  return (
    <div className="min-h-screen bg-gradient-primary relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Upload Your Health Data
          </h1>
          <p className="text-white/80 text-lg">
            Export your data from Apple Health and upload it here
          </p>
        </div>

        {processing && (
          <div className="max-w-3xl mx-auto mb-12 animate-fade-in">
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-6 left-0 right-0 h-1 bg-white/20">
                <div
                  className="h-full bg-white transition-all duration-500"
                  style={{
                    width: `${(steps.findIndex(s => s.id === currentStep) / (steps.length - 1)) * 100}%`
                  }}
                />
              </div>

              {steps.map((step, index) => {
                const status = getStepStatus(step.id);
                return (
                  <div key={step.id} className="relative flex flex-col items-center z-10">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                        status === "complete"
                          ? "bg-white text-primary"
                          : status === "active"
                          ? "bg-white text-primary animate-pulse-glow"
                          : "bg-white/20 text-white"
                      }`}
                    >
                      {status === "complete" ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : status === "active" ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <span className="text-white text-sm font-medium">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!processing && (
          <div className="max-w-2xl mx-auto animate-scale-in">
            <div className="bg-white/10 backdrop-blur-lg border-2 border-dashed border-white/30 rounded-3xl p-12 text-center hover:border-white/50 transition-all">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <UploadIcon className="w-10 h-10 text-white" />
              </div>

              <h3 className="text-2xl font-semibold text-white mb-3">
                {file ? file.name : "Choose your export.zip"}
              </h3>
              <p className="text-white/70 mb-8">
                Drag and drop or click to browse your files
              </p>

              <input
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />

              <label htmlFor="file-upload">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 cursor-pointer"
                  asChild
                >
                  <span>Select File</span>
                </Button>
              </label>

              {file && (
                <Button
                  size="lg"
                  onClick={processHealthData}
                  className="ml-4 bg-primary text-white hover:bg-primary/90"
                >
                  Process Data →
                </Button>
              )}
            </div>

            <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-white/80">
              <h4 className="font-semibold mb-3 text-white">How to export from Apple Health:</h4>
              <ol className="space-y-2 text-sm list-decimal list-inside">
                <li>Open the Health app on your iPhone</li>
                <li>Tap your profile picture in the top right</li>
                <li>Scroll down and tap "Export All Health Data"</li>
                <li>Save the export.zip file and upload it here</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
