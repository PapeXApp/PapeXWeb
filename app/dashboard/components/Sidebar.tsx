import React from "react"
import { Button } from "@/components/ui/button"

export function Sidebar({ setView, setIsAuthenticated }: { setView: (v: any) => void, setIsAuthenticated: (v: boolean) => void }) {
  return (
    <aside className="w-56 bg-[#eceded] p-8 flex flex-col gap-4 min-h-screen shadow-md rounded-r-lg">
      <h2 className="text-2xl font-bold text-[#00121D] mb-4">PapeX Blog Dashboard</h2>
      <Button variant="default" onClick={() => setView("all")} className="justify-start">All Posts</Button>
      <Button variant="ghost" onClick={() => setView("drafts")} className="justify-start">Drafts</Button>
      <Button variant="ghost" onClick={() => setView("editor")} className="justify-start">New Post</Button>
      <div className="flex-1" />
      <Button variant="destructive" onClick={() => setIsAuthenticated(false)} className="mt-4">Logout</Button>
    </aside>
  )
} 