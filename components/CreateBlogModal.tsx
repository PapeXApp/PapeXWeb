'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Plus, Upload, X, Bold, Type, Link, Italic } from "lucide-react"
import { blogService, CreateBlogPost } from '@/lib/blogServiceFree'
import { useAdminAuth } from '@/hooks/useAdmin'
import { fileToBase64 } from '@/lib/imageProcessing'

interface CreateBlogModalProps {
  onBlogCreated?: () => void
}

export function CreateBlogModal({ onBlogCreated }: CreateBlogModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { isAdmin } = useAdminAuth()
  
  const [formData, setFormData] = useState<CreateBlogPost>({
    title: '',
    excerpt: '',
    content: '',
    readTime: '5 min read',
    published: true
  })
  const [imageFile, setImageFile] = useState<File | null>(null)

  const handleInputChange = (field: keyof CreateBlogPost, value: string | boolean | File) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessingImage(true)
    setError('')

    try {
      // Create preview from file (for display)
      const { previewUrl } = await fileToBase64(file)
      setImagePreview(previewUrl)
      // Store the File object for upload to Storage
      setImageFile(file)
    } catch (processingError) {
      console.error('Error processing image:', processingError)
      setError('Unable to process that image. Please try a different file.')
    } finally {
      setIsProcessingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: undefined }))
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Rich text formatting functions
  const insertTextAtCursor = (before: string, after: string = '') => {
    const textarea = contentTextareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = formData.content.substring(start, end)
    const newText = formData.content.substring(0, start) + before + selectedText + after + formData.content.substring(end)
    
    setFormData(prev => ({ ...prev, content: newText }))
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  const formatHeader = (level: number) => {
    const headerPrefix = '#'.repeat(level) + ' '
    insertTextAtCursor(headerPrefix, '\n')
  }

  const formatBold = () => {
    insertTextAtCursor('**', '**')
  }

  const formatItalic = () => {
    insertTextAtCursor('*', '*')
  }

  const insertLink = () => {
    const url = prompt('Enter the URL:\n• For external sites: www.apple.com, https://google.com\n• For internal pages: /about, /contact, /waitlist')
    if (url) {
      const linkText = prompt('Enter the link text:') || url
      insertTextAtCursor(`[${linkText}](${url})`)
    }
  }

  // Convert markdown to HTML for blog display
  const convertMarkdownToHTML = (markdown: string): string => {
    return markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Smart Links - automatically detect external vs internal
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
        // Check if it's an external URL
        const isExternal = url.startsWith('http://') || 
                          url.startsWith('https://') || 
                          url.startsWith('www.') || 
                          url.includes('.')
        
        if (isExternal) {
          // Add https:// if it starts with www.
          const fullUrl = url.startsWith('www.') ? `https://${url}` : url
          return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`
        } else {
          // Internal link (stays on same site)
          return `<a href="${url}">${linkText}</a>`
        }
      })
      // Line breaks
      .replace(/\n/g, '<br>')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    console.log('Form submitted with data:', formData)

    try {
      console.log('Calling blogService.createBlog...')
      
      // Convert markdown content to HTML before saving
      const htmlContent = convertMarkdownToHTML(formData.content)
      let blogDataWithHTML = { ...formData, content: htmlContent }
      
      // Pass File object if available (will upload to Storage), otherwise use default
      if (imageFile) {
        blogDataWithHTML = { ...blogDataWithHTML, image: imageFile }
      } else {
        blogDataWithHTML = { ...blogDataWithHTML, image: '/blog/blog_image.png' }
      }
      
      const blogId = await blogService.createBlog(blogDataWithHTML)
      console.log('Blog created with ID:', blogId)
      
      // Reset form
      setFormData({
        title: '',
        excerpt: '',
        content: '',
        readTime: '5 min read',
        published: true
      })
      setImageFile(null)
      setImagePreview(null)
      setIsOpen(false)
      
      // Notify parent component
      onBlogCreated?.()
      
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      let errorMessage = 'Failed to create blog post'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAdmin) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg gradient-accent hover:shadow-2xl z-50 transform hover:scale-110 transition-all duration-300"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Blog Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter blog title..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt *</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => handleInputChange('excerpt', e.target.value)}
              placeholder="Brief description of the blog post..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            
            {/* Rich Text Toolbar */}
            <div className="flex flex-wrap gap-2 p-2 border border-input rounded-md bg-muted/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => formatHeader(2)}
                className="h-8"
                title="Header 2"
              >
                <Type className="h-4 w-4 mr-1" />
                H2
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => formatHeader(3)}
                className="h-8"
                title="Header 3"
              >
                <Type className="h-4 w-4 mr-1" />
                H3
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={formatBold}
                className="h-8"
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={formatItalic}
                className="h-8"
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={insertLink}
                className="h-8"
                title="Insert Link"
              >
                <Link className="h-4 w-4" />
              </Button>
            </div>
            
            <Textarea
              ref={contentTextareaRef}
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Write your blog content here using the toolbar above for formatting..."
              rows={10}
              required
              className="font-mono text-sm"
            />
            
            {/* Formatting Help */}
            <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
              <p><strong>Formatting Tips:</strong></p>
              <p>• Use the toolbar buttons above or type manually:</p>
              <p>• <code>## Header 2</code> for large headers</p>
              <p>• <code>### Header 3</code> for medium headers</p>
              <p>• <code>**bold text**</code> for bold formatting</p>
              <p>• <code>*italic text*</code> for italic formatting</p>
              <p>• <strong>Links (automatic detection):</strong></p>
              <p>• <code>[Apple](www.apple.com)</code> → external link (new tab)</p>
              <p>• <code>[Contact](/contact)</code> → internal link (same site)</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="readTime">Read Time</Label>
            <Input
              id="readTime"
              value={formData.readTime}
              onChange={(e) => handleInputChange('readTime', e.target.value)}
              placeholder="e.g., 5 min read"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Featured Image</Label>
            <Input
              ref={fileInputRef}
              id="blog-image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <div className="space-y-4">
              {imagePreview ? (
                <div className="space-y-3">
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Blog preview"
                      className="w-60 h-60 object-cover rounded-xl border shadow-sm bg-gray-50"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Replace
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We keep your original aspect ratio—use any size JPG or PNG.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="blog-image-upload"
                    className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-dashed border-input rounded-md hover:bg-accent hover:text-accent-foreground justify-center sm:justify-start"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Image
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    JPG or PNG. We keep the dimensions you upload (larger images may slow down loads).
                  </p>
                </div>
              )}
              {isProcessingImage && (
                <p className="text-xs text-muted-foreground">Processing image…</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="published"
              checked={formData.published}
              onCheckedChange={(checked) => handleInputChange('published', checked)}
            />
            <Label htmlFor="published">Publish immediately</Label>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Creating...' : 'Create Blog Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 