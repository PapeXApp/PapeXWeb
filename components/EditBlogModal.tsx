'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { blogService, BlogPost, CreateBlogPost } from '@/lib/blogServiceFree'
import { X, Bold, Italic, Type, Link, Upload } from 'lucide-react'
import { fileToBase64 } from '@/lib/imageProcessing'

interface EditBlogModalProps {
  isOpen: boolean
  onClose: () => void
  onBlogUpdated?: () => void
  blog: BlogPost
}

export function EditBlogModal({ isOpen, onClose, onBlogUpdated, blog }: EditBlogModalProps) {
  const [formData, setFormData] = useState<CreateBlogPost>({
    title: '',
    excerpt: '',
    content: '',
    readTime: '5 min read',
    published: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const [imageRemoved, setImageRemoved] = useState(false)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize form data when blog prop changes
  useEffect(() => {
    if (blog) {
      setFormData({
        title: blog.title,
        excerpt: blog.excerpt,
        content: blog.content,
        readTime: blog.readTime,
        published: blog.published
      })
      setImagePreview(blog.image || null)
      setNewImageFile(null)
      setImageRemoved(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [blog])

  const handleInputChange = (field: keyof CreateBlogPost, value: string | boolean | File) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
      setNewImageFile(file)
      setImageRemoved(false)
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
    setImagePreview(null)
    setNewImageFile(null)
    setImageRemoved(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const restoreOriginalImage = () => {
    if (blog?.image) {
      setImagePreview(blog.image)
      setNewImageFile(null)
      setImageRemoved(false)
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

    try {
      // Convert markdown content to HTML before saving
      const htmlContent = convertMarkdownToHTML(formData.content)
      let blogDataWithHTML: any = { ...formData, content: htmlContent }
      
      // Handle image: pass File for new uploads, or handle removal
      if (newImageFile) {
        blogDataWithHTML = { ...blogDataWithHTML, image: newImageFile }
      } else if (imageRemoved) {
        blogDataWithHTML = { ...blogDataWithHTML, image: '/blog/blog_image.png' }
      } else {
        // Keep existing image (don't update image field)
        delete blogDataWithHTML.image
      }
      
      await blogService.updateBlog(blog.id, blogDataWithHTML)
      
      // Reset and close
      setImagePreview(null)
      setNewImageFile(null)
      setImageRemoved(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onClose()
      
      // Notify parent component
      onBlogUpdated?.()
      
    } catch (error) {
      console.error('Error updating blog:', error)
      let errorMessage = 'Failed to update blog post'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Blog Post</DialogTitle>
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
              id="edit-blog-image"
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
                      className="w-60 h-60 object-cover rounded-lg border shadow-sm bg-gray-50"
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
                    Original aspect ratio is preserved—upload any size JPG or PNG.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-blog-image"
                    className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-input rounded-md hover:bg-accent hover:text-accent-foreground w-full sm:w-auto"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Image
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    JPG or PNG. We keep the dimensions you upload (larger images may slow down loads).
                  </p>
                  {imageRemoved && blog.image && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={restoreOriginalImage}
                    >
                      Restore original image
                    </Button>
                  )}
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
            <Label htmlFor="published">Published</Label>
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 gradient-accent text-white"
            >
              {isLoading ? 'Updating...' : 'Update Post'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 