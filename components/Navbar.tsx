'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Sun, Moon, UtensilsCrossed, LayoutDashboard, ShoppingBag, BarChart2 } from 'lucide-react'
import { useEffect, useState } from 'react'

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/reporte', label: 'Reporte', icon: BarChart2 },
]

export default function Navbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
              <UtensilsCrossed size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white tracking-tight">Restaurante</span>
          </Link>
          <div className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
                  }`}>
                  <Icon size={14} />
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
        {mounted && (
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-105 active:scale-95">
            {theme === 'dark'
              ? <Sun size={16} className="text-amber-400" />
              : <Moon size={16} className="text-slate-600" />}
          </button>
        )}
      </div>
    </nav>
  )
}
