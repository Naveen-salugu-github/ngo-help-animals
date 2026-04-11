"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { motion, useInView } from "framer-motion"

export type ImpactCounterTargets = {
  treesPlanted: number
  mealsServed: number
  volunteersJoined: number
  projectsFunded: number
}

function useAnimatedNumber(target: number, enabled: boolean) {
  const [display, setDisplay] = useState(0)
  const obj = useRef({ v: 0 })

  useEffect(() => {
    if (!enabled) {
      setDisplay(Math.round(target))
      return
    }
    obj.current.v = 0
    const t = gsap.to(obj.current, {
      v: target,
      duration: 2.1,
      ease: "power2.out",
      onUpdate: () => setDisplay(Math.round(obj.current.v)),
    })
    return () => {
      t.kill()
    }
  }, [enabled, target])

  return display
}

function formatInt(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n)
}

export function HomeImpactCounters({ targets }: { targets: ImpactCounterTargets }) {
  const root = useRef<HTMLDivElement>(null)
  const inView = useInView(root, { once: true, margin: "-12% 0px" })

  const trees = useAnimatedNumber(targets.treesPlanted, inView)
  const meals = useAnimatedNumber(targets.mealsServed, inView)
  const volunteers = useAnimatedNumber(targets.volunteersJoined, inView)
  const projects = useAnimatedNumber(targets.projectsFunded, inView)

  const items = [
    { label: "Trees planted", value: trees, hint: "Green cover from community programs" },
    { label: "Meals served", value: meals, hint: "Nutrition support linked to campaigns" },
    { label: "Volunteers joined", value: volunteers, hint: "People who signed up through Soul Space" },
    { label: "Projects funded", value: projects, hint: "Campaigns that reached their goal" },
  ]

  return (
    <motion.div
      ref={root}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-primary/20 bg-background/80 p-6 text-center shadow-sm backdrop-blur"
        >
          <p className="text-3xl font-bold tracking-tight text-primary">{formatInt(item.value)}</p>
          <p className="mt-2 text-sm font-medium text-foreground">{item.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
        </div>
      ))}
    </motion.div>
  )
}
