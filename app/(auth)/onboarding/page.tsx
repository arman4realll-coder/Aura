"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Flame,
  ChevronRight,
  ChevronLeft,
  User,
  Apple,
  Target,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { calculateMacroTargets, getMicroTargets } from "@/lib/calculations/macro-calculator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const onboardingSchema = z.object({
  display_name: z.string().min(2, "Name is required"),
  height_cm: z.coerce.number().min(100, "Enter valid height").max(250, "Enter valid height"),
  current_weight_kg: z.coerce.number().min(30, "Enter valid weight").max(200, "Enter valid weight"),
  age: z.coerce.number().min(13, "Must be at least 13").max(100, "Enter valid age"),
  body_type: z.enum(["ectomorph", "mesomorph", "endomorph"]),
  is_vegetarian: z.boolean(),
  dietary_region: z.string(),
  goal: z.enum(["recomp", "bulk", "cut"]),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const BODY_TYPES = [
  {
    value: "ectomorph",
    label: "Ectomorph",
    description: "Lean build, fast metabolism",
    emoji: "🏃",
  },
  {
    value: "mesomorph",
    label: "Mesomorph",
    description: "Athletic build, gains muscle easily",
    emoji: "💪",
  },
  {
    value: "endomorph",
    label: "Endomorph",
    description: "Stocky build, slower metabolism",
    emoji: "🐻",
  },
];

const REGIONS = [
  { value: "Gujarat", label: "Gujarat" },
  { value: "Punjab", label: "Punjab" },
  { value: "South India", label: "South India" },
  { value: "North India", label: "North India" },
  { value: "Maharashtra", label: "Maharashtra" },
  { value: "Bengal", label: "Bengal" },
];

const GOALS = [
  {
    value: "recomp",
    label: "Body Recomposition",
    description: "Build muscle, lose fat simultaneously",
    emoji: "⚖️",
  },
  {
    value: "bulk",
    label: "Lean Bulk",
    description: "Maximize muscle gain with minimal fat",
    emoji: "📈",
  },
  {
    value: "cut",
    label: "Cut",
    description: "Lose fat while preserving muscle",
    emoji: "✂️",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      is_vegetarian: true,
      dietary_region: "Gujarat",
      body_type: "mesomorph",
      goal: "recomp",
    },
  });

  const watchAll = watch();
  const selectedBodyType = watch("body_type");
  const selectedGoal = watch("goal");

  // Calculate targets when user reaches step 3
  const targets =
    watchAll.height_cm && watchAll.current_weight_kg && watchAll.age && watchAll.goal
      ? calculateMacroTargets({
          display_name: watchAll.display_name || "",
          height_cm: watchAll.height_cm,
          current_weight_kg: watchAll.current_weight_kg,
          age: watchAll.age,
          body_type: watchAll.body_type,
          is_vegetarian: watchAll.is_vegetarian,
          dietary_region: watchAll.dietary_region,
          goal: watchAll.goal,
        })
      : null;

  const nextStep = async () => {
    let fieldsToValidate: (keyof OnboardingFormData)[] = [];

    if (step === 1) {
      fieldsToValidate = ["display_name", "height_cm", "current_weight_kg", "age", "body_type"];
    } else if (step === 2) {
      fieldsToValidate = ["is_vegetarian", "dietary_region"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((s) => Math.min(s + 1, 3));
    }
  };

  const prevStep = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const onSubmit = async (data: OnboardingFormData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in first");
        router.push("/login");
        return;
      }

      const macroTargets = calculateMacroTargets(data);
      const microTargets = getMicroTargets();

      // Create profile
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email!,
        display_name: data.display_name,
        height_cm: data.height_cm,
        current_weight_kg: data.current_weight_kg,
        starting_weight_kg: data.current_weight_kg,
        age: data.age,
        body_type: data.body_type,
        is_vegetarian: data.is_vegetarian,
        dietary_region: data.dietary_region,
        protein_target_g: macroTargets.protein_target_g,
        carbs_target_g: macroTargets.carbs_target_g,
        fats_target_g: macroTargets.fats_target_g,
        calories_target: macroTargets.calories_target,
        ...microTargets,
        total_xp: 0,
        current_level: 1,
        current_hp: 100,
        max_hp: 100,
        current_streak: 0,
        longest_streak: 0,
        rank: "Novice",
      });

      if (error) {
        console.error("Profile creation error:", error);
        toast.error("Failed to create profile. Please try again.");
        return;
      }

      toast.success("Profile created! Welcome to Aura 🔥");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-primary/10 to-transparent blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Aura</span>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  step >= s
                    ? "bg-primary text-white"
                    : "bg-card border border-border text-muted-foreground"
                )}
              >
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    "w-12 h-1 mx-1 rounded-full transition-all",
                    step > s ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {/* Step 1: Physical Profile */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-2">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>Physical Profile</CardTitle>
                    <CardDescription>Let&apos;s get to know your body</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="display_name">Display Name</Label>
                      <Input
                        id="display_name"
                        placeholder="Your name"
                        {...register("display_name")}
                        error={errors.display_name?.message}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="height_cm">Height (cm)</Label>
                        <Input
                          id="height_cm"
                          type="number"
                          placeholder="175"
                          {...register("height_cm")}
                          error={errors.height_cm?.message}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="current_weight_kg">Weight (kg)</Label>
                        <Input
                          id="current_weight_kg"
                          type="number"
                          placeholder="70"
                          {...register("current_weight_kg")}
                          error={errors.current_weight_kg?.message}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="22"
                        {...register("age")}
                        error={errors.age?.message}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Body Type</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {BODY_TYPES.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() =>
                              setValue("body_type", type.value as "ectomorph" | "mesomorph" | "endomorph")
                            }
                            className={cn(
                              "p-3 rounded-lg border text-center transition-all",
                              selectedBodyType === type.value
                                ? "border-primary bg-primary/20 text-white"
                                : "border-border bg-card hover:border-primary/50"
                            )}
                          >
                            <span className="text-2xl block mb-1">{type.emoji}</span>
                            <span className="text-xs font-medium">{type.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Diet Preferences */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                      <Apple className="w-6 h-6 text-green-500" />
                    </div>
                    <CardTitle>Diet Preferences</CardTitle>
                    <CardDescription>Tell us about your eating habits</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Diet Type</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setValue("is_vegetarian", true)}
                          className={cn(
                            "p-4 rounded-lg border text-center transition-all",
                            watchAll.is_vegetarian
                              ? "border-green-500 bg-green-500/20"
                              : "border-border bg-card hover:border-green-500/50"
                          )}
                        >
                          <span className="text-3xl block mb-2">🥬</span>
                          <span className="font-medium">Vegetarian</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue("is_vegetarian", false)}
                          className={cn(
                            "p-4 rounded-lg border text-center transition-all",
                            !watchAll.is_vegetarian
                              ? "border-red-500 bg-red-500/20"
                              : "border-border bg-card hover:border-red-500/50"
                          )}
                        >
                          <span className="text-3xl block mb-2">🍗</span>
                          <span className="font-medium">Non-Vegetarian</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dietary_region">Dietary Region</Label>
                      <Select {...register("dietary_region")}>
                        {REGIONS.map((region) => (
                          <option key={region.value} value={region.value}>
                            {region.label}
                          </option>
                        ))}
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        This helps us suggest foods from your cuisine
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Goal Selection */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-2">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>Your Goal</CardTitle>
                    <CardDescription>What do you want to achieve?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      {GOALS.map((goal) => (
                        <button
                          key={goal.value}
                          type="button"
                          onClick={() =>
                            setValue("goal", goal.value as "recomp" | "bulk" | "cut")
                          }
                          className={cn(
                            "w-full p-4 rounded-lg border text-left transition-all flex items-center gap-4",
                            selectedGoal === goal.value
                              ? "border-primary bg-primary/20"
                              : "border-border bg-card hover:border-primary/50"
                          )}
                        >
                          <span className="text-3xl">{goal.emoji}</span>
                          <div>
                            <p className="font-semibold">{goal.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {goal.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Calculated Targets Preview */}
                    {targets && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-lg bg-background/50 border border-border"
                      >
                        <p className="text-sm font-medium text-muted-foreground mb-3">
                          Your Daily Targets
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-2 rounded-lg bg-card">
                            <p className="text-2xl font-bold text-primary">
                              {targets.calories_target}
                            </p>
                            <p className="text-xs text-muted-foreground">Calories</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-card">
                            <p className="text-2xl font-bold text-green-400">
                              {targets.protein_target_g}g
                            </p>
                            <p className="text-xs text-muted-foreground">Protein</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-card">
                            <p className="text-2xl font-bold text-blue-400">
                              {targets.carbs_target_g}g
                            </p>
                            <p className="text-xs text-muted-foreground">Carbs</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-card">
                            <p className="text-2xl font-bold text-yellow-400">
                              {targets.fats_target_g}g
                            </p>
                            <p className="text-xs text-muted-foreground">Fats</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <Button type="button" variant="secondary" onClick={prevStep} className="flex-1">
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button type="button" onClick={nextStep} className="flex-1">
                Next
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            ) : (
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Start Journey
                    <Flame className="w-5 h-5 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}

