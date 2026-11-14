"use client"

import { useTheme } from "next-themes"
import { MoonIcon, SunIcon } from "@/components/icons";
import { Button } from "@/components/ui/button"
import { useMounted } from "@/hooks/use-mounted";

export default function ThemeSwitcher() {
  const mounted = useMounted()
  const { theme, setTheme } = useTheme()

  if (!mounted) {
    return null
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-3xl"
    >
      {theme === "dark" ? <SunIcon className="h-[1.2rem] w-[1.2rem]" /> : <MoonIcon className="h-[1.2rem] w-[1.2rem]" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
