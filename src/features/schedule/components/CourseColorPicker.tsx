"use client"

import * as React from "react"
import { Check, Pipette } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export const COURSE_COLOR_PRESETS = [
  "#4d7668", "#a855f7", "#7c3aed", "#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#84cc16",
  "#eab308", "#f97316", "#ef4444", "#ec4899", "#f43f5e", "#ffffff", "#94a3b8", "#000000",
]

const RECENT_KEY = "tma_courseColorRecent"
const RECENT_LIMIT = 10

type Hsv = { h: number; s: number; v: number }

function normalizeHex(input: string): string | null {
  const text = input.trim().replace(/^#/, "").toLowerCase()
  if (/^[0-9a-f]{3}$/.test(text)) return `#${text.split("").map((char) => char + char).join("")}`
  if (/^[0-9a-f]{6}$/.test(text)) return `#${text}`
  return null
}

function hexToHsv(hex: string): Hsv {
  const value = normalizeHex(hex) ?? "#000000"
  const r = parseInt(value.slice(1, 3), 16) / 255
  const g = parseInt(value.slice(3, 5), 16) / 255
  const b = parseInt(value.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const delta = max - Math.min(r, g, b)
  let h = 0
  if (delta) {
    if (max === r) h = ((g - b) / delta) % 6
    else if (max === g) h = (b - r) / delta + 2
    else h = (r - g) / delta + 4
  }
  return { h: (h * 60 + 360) % 360, s: max ? delta / max : 0, v: max }
}

function hsvToHex({ h, s, v }: Hsv): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return Math.round((v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255)
  }
  return `#${[f(5), f(3), f(1)].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`
}

function loadRecent(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]")
    return Array.isArray(parsed) ? parsed.filter((item) => normalizeHex(String(item))).slice(0, RECENT_LIMIT) : []
  } catch {
    return []
  }
}

function saveRecent(colors: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(colors))
  } catch {
    // Recent colours are a convenience; ignore storage failures.
  }
}

// Reports pointer position inside `ref` as 0..1 fractions while dragging.
function useDrag(ref: React.RefObject<HTMLDivElement>, onMove: (x: number, y: number) => void, onEnd: () => void) {
  return (event: React.PointerEvent<HTMLDivElement>) => {
    const element = ref.current
    if (!element) return
    element.setPointerCapture(event.pointerId)
    const update = (clientX: number, clientY: number) => {
      const rect = element.getBoundingClientRect()
      onMove(
        Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
        Math.min(1, Math.max(0, (clientY - rect.top) / rect.height))
      )
    }
    update(event.clientX, event.clientY)
    const move = (e: PointerEvent) => update(e.clientX, e.clientY)
    const up = () => {
      element.removeEventListener("pointermove", move)
      element.removeEventListener("pointerup", up)
      element.removeEventListener("pointercancel", up)
      onEnd()
    }
    element.addEventListener("pointermove", move)
    element.addEventListener("pointerup", up)
    element.addEventListener("pointercancel", up)
  }
}

export function CourseColorPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const current = normalizeHex(value) ?? "#4d7668"
  const [open, setOpen] = React.useState(false)
  const [hsv, setHsv] = React.useState<Hsv>(() => hexToHsv(current))
  const [hexText, setHexText] = React.useState(current)
  const [recent, setRecent] = React.useState<string[]>(loadRecent)
  const areaRef = React.useRef<HTMLDivElement>(null)
  const hueRef = React.useRef<HTMLDivElement>(null)
  const latest = React.useRef(current)
  latest.current = current

  // Keep the picker in sync when the value changes from outside (e.g. editing another course).
  React.useEffect(() => {
    setHexText(current)
    setHsv((previous) => (hsvToHex(previous) === current ? previous : hexToHsv(current)))
  }, [current])

  // A colour only lands in "Recent" once the user settles on it and it is not a preset.
  const commitRecent = React.useCallback((color: string) => {
    if (COURSE_COLOR_PRESETS.includes(color)) return
    setRecent((previous) => {
      const next = [color, ...previous.filter((item) => item !== color)].slice(0, RECENT_LIMIT)
      saveRecent(next)
      return next
    })
  }, [])

  const apply = (next: Hsv) => {
    setHsv(next)
    onChange(hsvToHex(next))
  }

  const pick = (color: string) => {
    setHsv(hexToHsv(color))
    onChange(color)
  }

  const onAreaDown = useDrag(areaRef, (x, y) => apply({ ...hsv, s: x, v: 1 - y }), () => commitRecent(latest.current))
  const onHueDown = useDrag(hueRef, (x) => apply({ ...hsv, h: x * 360 }), () => commitRecent(latest.current))

  const commitHex = () => {
    const parsed = normalizeHex(hexText)
    if (!parsed) {
      setHexText(current)
      return
    }
    pick(parsed)
    commitRecent(parsed)
  }

  const eyeDropper = (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper
  const useEyeDropper = async () => {
    if (!eyeDropper) return
    try {
      const result = await new eyeDropper().open()
      const parsed = normalizeHex(result.sRGBHex)
      if (parsed) {
        pick(parsed)
        commitRecent(parsed)
      }
    } catch {
      // Cancelled by the user.
    }
  }

  const swatch = (color: string) => (
    <button
      key={color}
      type="button"
      className={cn("color-swatch", color === "#ffffff" && "is-light", color === current && "is-selected")}
      style={{ background: color }}
      aria-label={`Use ${color}`}
      aria-pressed={color === current}
      onClick={() => {
        pick(color)
        commitRecent(color)
      }}
    >
      {color === current && <Check size={11} style={{ color: color === "#ffffff" ? "#172033" : "#fff" }} />}
    </button>
  )

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) commitRecent(latest.current)
      }}
    >
      <PopoverTrigger asChild>
        <button type="button" className="schedule-control-trigger course-color-trigger" aria-label="Course color">
          <span className="course-color-dot" style={{ background: current }} />
          <span>{current}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" side="bottom" sideOffset={8} collisionPadding={12} className="course-color-popover w-auto p-0">
        <div
          ref={areaRef}
          className="color-area"
          style={{ backgroundColor: hsvToHex({ h: hsv.h, s: 1, v: 1 }) }}
          onPointerDown={onAreaDown}
        >
          <span className="color-handle" style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }} />
        </div>

        <div className="color-hue-row">
          <button type="button" className="color-icon-btn" onClick={useEyeDropper} disabled={!eyeDropper} aria-label="Pick color from screen" title={eyeDropper ? "Pick from screen" : "Not supported in this browser"}>
            <Pipette size={16} />
          </button>
          <div ref={hueRef} className="color-hue" onPointerDown={onHueDown}>
            <span className="color-handle" style={{ left: `${(hsv.h / 360) * 100}%`, background: hsvToHex({ h: hsv.h, s: 1, v: 1 }) }} />
          </div>
        </div>

        <label className="color-hex-row">
          <span>Hex</span>
          <input
            value={hexText}
            maxLength={7}
            spellCheck={false}
            onChange={(event) => setHexText(event.target.value)}
            onBlur={commitHex}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                commitHex()
              }
            }}
          />
        </label>

        <div className="color-swatch-grid" role="group" aria-label="Preset colors">{COURSE_COLOR_PRESETS.map(swatch)}</div>

        <div className="color-recent">
          <strong>Recent</strong>
          {recent.length === 0
            ? <p>Colors you pick yourself will appear here.</p>
            : <div className="color-swatch-grid" role="group" aria-label="Recent colors">{recent.map(swatch)}</div>}
        </div>
      </PopoverContent>
    </Popover>
  )
}
