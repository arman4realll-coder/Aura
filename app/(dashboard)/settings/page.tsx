"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Target,
  Scale,
  Copy,
  Check,
  LogOut,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useGameStore } from "@/lib/store/game-store";
import { calculateMacroTargets } from "@/lib/calculations/macro-calculator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RankBadge } from "@/components/game/rank-badge";

const settingsSchema = z.object({
  display_name: z.string().min(2, "Name is required"),
  current_weight_kg: z.coerce.number().min(30).max(200),
  target_weight_kg: z.coerce.number().min(30).max(200).optional(),
  protein_target_g: z.coerce.number().min(50).max(300),
  carbs_target_g: z.coerce.number().min(50).max(500),
  fats_target_g: z.coerce.number().min(20).max(200),
  calories_target: z.coerce.number().min(1000).max(5000),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const { profile, reset } = useGameStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [saveCode, setSaveCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      display_name: profile?.display_name || "",
      current_weight_kg: profile?.current_weight_kg || 70,
      target_weight_kg: profile?.target_weight_kg || undefined,
      protein_target_g: profile?.protein_target_g || 150,
      carbs_target_g: profile?.carbs_target_g || 300,
      fats_target_g: profile?.fats_target_g || 70,
      calories_target: profile?.calories_target || 2500,
    },
  });

  const currentWeight = watch("current_weight_kg");

  const handleRecalculate = () => {
    if (!profile) return;

    const targets = calculateMacroTargets({
      display_name: profile.display_name || "",
      height_cm: profile.height_cm,
      current_weight_kg: currentWeight || profile.current_weight_kg,
      age: profile.age,
      body_type: profile.body_type || "mesomorph",
      is_vegetarian: profile.is_vegetarian,
      dietary_region: profile.dietary_region,
      goal: "recomp",
    });

    setValue("protein_target_g", targets.protein_target_g);
    setValue("carbs_target_g", targets.carbs_target_g);
    setValue("fats_target_g", targets.fats_target_g);
    setValue("calories_target", targets.calories_target);

    toast.success("Targets recalculated based on current weight");
  };

  const onSubmit = async (data: SettingsFormData) => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: data.display_name,
          current_weight_kg: data.current_weight_kg,
          target_weight_kg: data.target_weight_kg,
          protein_target_g: data.protein_target_g,
          carbs_target_g: data.carbs_target_g,
          fats_target_g: data.fats_target_g,
          calories_target: data.calories_target,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("Settings saved successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateSaveCode = async () => {
    if (!profile) return;

    setIsGeneratingCode(true);
    try {
      const code = `XP${profile.total_xp}L${profile.current_level}S${profile.current_streak}W${profile.current_weight_kg}`;
      const encoded = btoa(code);
      setSaveCode(encoded);
    } catch (error) {
      toast.error("Failed to generate save code");
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleCopyCode = async () => {
    if (!saveCode) return;

    try {
      await navigator.clipboard.writeText(saveCode);
      setCopied(true);
      toast.success("Save code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    reset();
    router.push("/");
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and preferences
        </p>
      </motion.div>

      {/* Profile Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-primary/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {profile.display_name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">
                  {profile.display_name}
                </h2>
                <p className="text-muted-foreground">{profile.email}</p>
              </div>
              <RankBadge rank={profile.rank} size="lg" />
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 rounded-lg bg-background">
                <p className="text-2xl font-bold text-white">
                  {profile.current_level}
                </p>
                <p className="text-xs text-muted-foreground">Level</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-background">
                <p className="text-2xl font-bold text-yellow-400">
                  {profile.total_xp.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total XP</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-background">
                <p className="text-2xl font-bold text-primary">
                  {profile.longest_streak}
                </p>
                <p className="text-xs text-muted-foreground">Best Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Profile Settings Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  {...register("display_name")}
                  error={errors.display_name?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current_weight_kg">Current Weight (kg)</Label>
                  <Input
                    id="current_weight_kg"
                    type="number"
                    step="0.1"
                    {...register("current_weight_kg")}
                    error={errors.current_weight_kg?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_weight_kg">Target Weight (kg)</Label>
                  <Input
                    id="target_weight_kg"
                    type="number"
                    step="0.1"
                    {...register("target_weight_kg")}
                    error={errors.target_weight_kg?.message}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Macro Targets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-400" />
                  Daily Targets
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRecalculate}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recalculate
                </Button>
              </div>
              <CardDescription>
                Adjust your daily macro and calorie targets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="protein_target_g">Protein (g)</Label>
                  <Input
                    id="protein_target_g"
                    type="number"
                    {...register("protein_target_g")}
                    error={errors.protein_target_g?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbs_target_g">Carbs (g)</Label>
                  <Input
                    id="carbs_target_g"
                    type="number"
                    {...register("carbs_target_g")}
                    error={errors.carbs_target_g?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fats_target_g">Fats (g)</Label>
                  <Input
                    id="fats_target_g"
                    type="number"
                    {...register("fats_target_g")}
                    error={errors.fats_target_g?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calories_target">Calories</Label>
                  <Input
                    id="calories_target"
                    type="number"
                    {...register("calories_target")}
                    error={errors.calories_target?.message}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Button type="submit" className="w-full" disabled={isSaving}>
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
        </Button>
      </form>

      {/* Save Code */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-purple-400" />
              Save Code
            </CardTitle>
            <CardDescription>
              Generate a shareable code with your current progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {saveCode ? (
              <div className="flex gap-2">
                <Input value={saveCode} readOnly className="font-mono text-sm" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyCode}
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGenerateSaveCode}
                disabled={isGeneratingCode}
              >
                {isGeneratingCode ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Generate Save Code"
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Sign Out */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          type="button"
          variant="destructive"
          className="w-full"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>
      </motion.div>
    </div>
  );
}

