import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  bucket?: string;
  folder?: string;
  accept?: string;
}

function getFileName(url: string): string {
  try {
    const parts = url.split('/');
    const raw = parts[parts.length - 1];
    // Remove the timestamp-random prefix (e.g., "1234567890-abc123.")
    const match = raw.match(/^\d+-[a-z0-9]+\.(.+)$/);
    return match ? `archivo.${match[1]}` : raw;
  } catch {
    return 'archivo';
  }
}

function isImageUrl(url: string): boolean {
  return /\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(url);
}

export function FileUpload({
  value,
  onChange,
  bucket = 'inventory-attachments',
  folder = '',
  accept = 'image/*,.pdf',
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!isSupabaseConfigured) return;
      setUploading(true);
      try {
        const ext = file.name.split('.').pop();
        const fileName = `${folder ? folder + '/' : ''}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(fileName);

        onChange(publicUrl);
      } catch (err) {
        console.error('Upload error:', err);
      } finally {
        setUploading(false);
      }
    },
    [bucket, folder, onChange],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleRemove = () => {
    onChange(null);
  };

  if (value) {
    const name = getFileName(value);
    const isImage = isImageUrl(value);

    return (
      <div className="flex items-center gap-3 rounded-lg border p-3">
        {isImage ? (
          <Image className="h-5 w-5 shrink-0 text-blue-500" />
        ) : (
          <FileText className="h-5 w-5 shrink-0 text-red-500" />
        )}
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 truncate text-sm text-blue-600 underline hover:text-blue-800"
        >
          {name}
        </a>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={handleRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors',
        dragOver
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary/50',
        uploading && 'pointer-events-none opacity-50',
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileSelect}
      />
      {uploading ? (
        <p className="text-sm text-muted-foreground">Subiendo...</p>
      ) : (
        <>
          <Upload className="mb-1 h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Arrastra un archivo o haz clic
          </p>
          <p className="text-xs text-muted-foreground/70">PNG, JPG, PDF</p>
        </>
      )}
    </div>
  );
}
