"use client"
import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (username && password) {
      onLogin()
    } else {
      setError("Please enter username and password")
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#0a2431] p-8 rounded-lg max-w-sm mx-auto mt-24"
    >
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center text-white mb-2">Login</h2>
        <div className="space-y-2 text-left">
          <Label htmlFor="username" className="text-white">
            Username
          </Label>
          <Input
            id="username"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="bg-white text-[#00121D]"
            autoComplete="username"
          />
        </div>
        <div className="space-y-2 text-left">
          <Label htmlFor="password" className="text-white">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-white text-[#00121D]"
            autoComplete="current-password"
          />
        </div>
        {error && <div className="text-red-400 text-sm text-center">{error}</div>}
        <Button type="submit" className="w-full bg-[#EB7100] hover:bg-[#cc6300] text-white py-6 mt-2">
          Login
        </Button>
      </div>
    </form>
  )
} 