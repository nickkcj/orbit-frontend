"use client"

import { useEffect, ReactNode } from "react"
import { useTenant, ThemeSettings } from "./tenant-provider"

// Default theme colors (matching Tailwind config)
const DEFAULT_THEME: Required<ThemeSettings> = {
  primaryColor: "#7c3aed",  // Purple 600
  accentColor: "#06b6d4",   // Cyan 500
  bannerUrl: "",
}

// Convert hex to HSL for CSS variables
function hexToHSL(hex: string): { h: number; s: number; l: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return null

  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

function applyTheme(theme: ThemeSettings) {
  const root = document.documentElement

  // Apply primary color
  const primaryColor = theme.primaryColor || DEFAULT_THEME.primaryColor
  const primaryHSL = hexToHSL(primaryColor)
  if (primaryHSL) {
    root.style.setProperty("--primary", `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`)
    // Generate foreground (light text for dark backgrounds)
    root.style.setProperty("--primary-foreground", "0 0% 100%")
  }

  // Apply accent color
  const accentColor = theme.accentColor || DEFAULT_THEME.accentColor
  const accentHSL = hexToHSL(accentColor)
  if (accentHSL) {
    root.style.setProperty("--accent", `${accentHSL.h} ${accentHSL.s}% ${accentHSL.l}%`)
    root.style.setProperty("--accent-foreground", "0 0% 100%")
  }

  // Store banner URL for components to use
  if (theme.bannerUrl) {
    root.style.setProperty("--tenant-banner-url", `url(${theme.bannerUrl})`)
  } else {
    root.style.removeProperty("--tenant-banner-url")
  }
}

function resetTheme() {
  const root = document.documentElement
  root.style.removeProperty("--primary")
  root.style.removeProperty("--primary-foreground")
  root.style.removeProperty("--accent")
  root.style.removeProperty("--accent-foreground")
  root.style.removeProperty("--tenant-banner-url")
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { tenant } = useTenant()

  useEffect(() => {
    if (tenant?.settings?.theme) {
      applyTheme(tenant.settings.theme)
    } else {
      resetTheme()
    }

    return () => {
      resetTheme()
    }
  }, [tenant?.settings?.theme])

  return <>{children}</>
}
