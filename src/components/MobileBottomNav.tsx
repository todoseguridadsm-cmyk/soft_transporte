'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Truck, Receipt, Bell, LogOut } from 'lucide-react'
import { logout } from '@/app/actions/auth'

export function MobileBottomNav({ hasAlerts }: { hasAlerts?: boolean }) {
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Inicio' },
    { href: '/dashboard/trips', icon: Truck, label: 'Viajes' },
    { href: '/dashboard/expenses', icon: Receipt, label: 'Tickets' },
  ]

  return (
    <>
      <div className="h-20 md:hidden" /> {/* Spacer para móvil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111827]/95 backdrop-blur-xl border-t border-border/20 pb-safe shadow-[0_-4px_25px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = item.href === '/dashboard' 
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${
                  isActive ? 'text-blue-500' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <div className={`relative p-1 rounded-full ${isActive ? 'bg-blue-500/10' : ''}`}>
                  <Icon className={`w-6 h-6 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`} />
                  {item.icon === Bell && hasAlerts && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]"></span>
                  )}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
              </Link>
            )
          })}

          <form action={logout} className="flex flex-col items-center justify-center w-full h-full">
            <button type="submit" className="flex flex-col items-center justify-center space-y-1 text-gray-400 hover:text-red-400 transition-colors">
              <div className="p-1">
                <LogOut className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-medium">Salir</span>
            </button>
          </form>
        </div>
      </nav>
    </>
  )
}
