"use client"
import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

function randomId() {
  return Math.random().toString(36).slice(2)
}

export function BlogEditor({ blog, setView }: { blog: any, setView: (v: any) => void }) {
  const [title, setTitle] = useState(blog?.title || "")
  const [content, setContent] = useState(blog?.content || "")

  function save(status: "draft" | "published") {
    const all = JSON.parse(localStorage.getItem("blogs") || "[]")
    let updated
    if (blog) {
      updated = all.map((b: any) => b.id === blog.id ? { ...b, title, content, status, updatedAt: Date.now() } : b)
    } else {
      updated = [
        ...all,
        { id: randomId(), title, content, status, createdAt: Date.now(), updatedAt: Date.now() }
      ]
    }
    localStorage.setItem("blogs", JSON.stringify(updated))
    setView(status === "draft" ? "drafts" : "all")
  }

  return (
    <div className="bg-[#0a2431] p-8 rounded-lg max-w-xl mx-auto mt-16">
      <h2 className="text-2xl font-bold text-center text-white mb-6">{blog ? "Edit Post" : "New Post"}</h2>
      <div className="space-y-6">
        <div className="space-y-2 text-left">
          <Label htmlFor="title" className="text-white">Title</Label>
          <Input
            id="title"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="bg-white text-[#00121D] text-lg"
          />
        </div>
        <div className="space-y-2 text-left">
          <Label htmlFor="content" className="text-white">Content</Label>
          <textarea
            id="content"
            placeholder="Content"
            value={content}
            onChange={e => setContent(e.target.value)}
            className="bg-white text-[#00121D] w-full rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[180px] resize-vertical"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-end mt-4">
          <Button type="button" onClick={() => save("draft")}
            className="bg-[#EB7100] hover:bg-[#cc6300] text-white px-6 py-3 w-full sm:w-auto">Save Draft</Button>
          <Button type="button" onClick={() => save("published")}
            className="bg-[#00121D] hover:bg-[#0a2431] text-white px-6 py-3 w-full sm:w-auto">Publish</Button>
          <Button type="button" onClick={() => setView("all")}
            variant="secondary" className="w-full sm:w-auto">Cancel</Button>
        </div>
      </div>
    </div>
  )
} 