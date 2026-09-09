"use client"
import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function BlogList({ type, setView, setEditingBlog }: { type: "published" | "draft", setView: (v: any) => void, setEditingBlog: (b: any) => void }) {
  const [blogs, setBlogs] = useState<any[]>([])

  useEffect(() => {
    const all = JSON.parse(localStorage.getItem("blogs") || "[]")
    setBlogs(all.filter((b: any) => (type === "published" ? b.status === "published" : b.status === "draft")))
  }, [type])

  function handleEdit(blog: any) {
    setEditingBlog(blog)
    setView("editor")
  }

  function handleDelete(id: string) {
    const all = JSON.parse(localStorage.getItem("blogs") || "[]")
    const updated = all.filter((b: any) => b.id !== id)
    localStorage.setItem("blogs", JSON.stringify(updated))
    setBlogs(updated.filter((b: any) => (type === "published" ? b.status === "published" : b.status === "draft")))
  }

  return (
    <div className="max-w-xl mx-auto mt-12">
      <h2 className="text-2xl font-bold text-center mb-6">{type === "published" ? "Published Posts" : "Drafts"}</h2>
      {blogs.length === 0 ? <div className="text-center text-gray-400">No posts found.</div> : (
        <ul className="space-y-4">
          {blogs.map(blog => (
            <li key={blog.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col gap-2">
              <div className="font-semibold text-lg text-[#00121D]">{blog.title}</div>
              <div className="text-xs text-gray-500">{blog.status} | {new Date(blog.updatedAt).toLocaleString()}</div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={() => handleEdit(blog)} className="bg-[#0a2431] hover:bg-[#0a2431] text-white">Edit</Button>
                <Button size="sm" onClick={() => handleDelete(blog.id)} variant="destructive">Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
} 