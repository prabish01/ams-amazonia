"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.includes("Invalid login")) {
          toast.error("Invalid email or password");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Please verify your email address first");
        } else {
          toast.error(error.message || "Sign in failed");
        }
        return;
      }

      toast.success("Welcome back!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const inputContainerStyle = (focused: boolean, hasError: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#0A0A0B",
    border: `1px solid ${hasError ? "#EF4444" : focused ? "#F5A623" : "#27272A"}`,
    borderRadius: "10px",
    padding: "0 14px",
    height: "48px",
    transition: "border-color 0.2s ease",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0A0A0B",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background ambient */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "400px",
          background: "radial-gradient(ellipse at center, rgba(245,166,35,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          left: "10%",
          width: "400px",
          height: "300px",
          background: "radial-gradient(ellipse at center, rgba(59,130,246,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#111113",
          border: "1px solid #27272A",
          borderRadius: "20px",
          padding: "40px 36px",
          position: "relative",
          zIndex: 1,
          boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
        }}
      >
        {/* Branding */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 60,
              height: 60,
              borderRadius: "14px",
              backgroundColor: "rgba(245,166,35,0.1)",
              border: "1px solid rgba(245,166,35,0.2)",
              marginBottom: "20px",
            }}
          >
            <span style={{ fontSize: "28px", fontWeight: 800, color: "#F5A623" }}>A</span>
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "26px",
              fontWeight: 800,
              letterSpacing: "0.06em",
              color: "#E8E8E8",
              lineHeight: 1,
            }}
          >
            <span style={{ color: "#F5A623" }}>A</span>MAZONIA
          </h1>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "13px",
              color: "#52525B",
              letterSpacing: "0.06em",
              fontWeight: 500,
              textTransform: "uppercase",
            }}
          >
            HR Management
          </p>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 600, color: "#E8E8E8" }}>
            Sign in to your account
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#52525B" }}>
            Use your Amazonia HR credentials
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Email */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#A1A1AA", marginBottom: "6px" }}>
              Email address
            </label>
            <div style={inputContainerStyle(emailFocused, !!errors.email)}>
              <Mail size={16} style={{ color: emailFocused ? "#F5A623" : "#52525B", flexShrink: 0, transition: "color 0.2s" }} />
              <input
                {...register("email")}
                type="email"
                placeholder="you@amazonia.hk"
                autoComplete="email"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#E8E8E8",
                  fontSize: "14px",
                }}
              />
            </div>
            {errors.email && (
              <p style={{ margin: "5px 0 0", fontSize: "12px", color: "#EF4444" }}>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#A1A1AA", marginBottom: "6px" }}>
              Password
            </label>
            <div style={inputContainerStyle(passwordFocused, !!errors.password)}>
              <Lock size={16} style={{ color: passwordFocused ? "#F5A623" : "#52525B", flexShrink: 0, transition: "color 0.2s" }} />
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#E8E8E8",
                  fontSize: "14px",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#52525B",
                  display: "flex",
                  alignItems: "center",
                  padding: 0,
                  flexShrink: 0,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#A1A1AA"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#52525B"; }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p style={{ margin: "5px 0 0", fontSize: "12px", color: "#EF4444" }}>
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              height: "48px",
              backgroundColor: isSubmitting ? "#D4901E" : "#F5A623",
              color: "#0A0A0B",
              border: "none",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: 700,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "4px",
              transition: "background-color 0.2s ease, transform 0.1s ease",
              letterSpacing: "0.02em",
            }}
            onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = "#D4901E"; }}
            onMouseLeave={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = "#F5A623"; }}
            onMouseDown={(e) => { if (!isSubmitting) e.currentTarget.style.transform = "scale(0.98)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p
        style={{
          marginTop: "32px",
          fontSize: "11px",
          color: "#3F3F46",
          textAlign: "center",
          letterSpacing: "0.03em",
          position: "relative",
          zIndex: 1,
        }}
      >
        Powered by Amazonia Group, Hong Kong
      </p>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
