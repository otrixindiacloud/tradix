import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, File, Image, X, Download, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface AttachmentManagerProps {
  attachments?: any[];
  onAttachmentsChange?: (attachments: any[]) => void;
  maxFiles?: number;
  maxSizeBytes?: number;
  allowedTypes?: string[];
  readOnly?: boolean;
}

export default function AttachmentManager({
  attachments = [],
  onAttachmentsChange,
  maxFiles = 10,
  maxSizeBytes = 10 * 1024 * 1024, // 10MB
  allowedTypes = ["image/*", "application/pdf", ".doc", ".docx", ".txt"],
  readOnly = false,
}: AttachmentManagerProps) {
  const [previewFile, setPreviewFile] = useState<any>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (readOnly) return;

    const newAttachments = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
    }));

    const updatedAttachments = [...attachments, ...newAttachments];
    onAttachmentsChange?.(updatedAttachments);
  }, [attachments, onAttachmentsChange, readOnly]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: allowedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxFiles: maxFiles - attachments.length,
    maxSize: maxSizeBytes,
    disabled: readOnly,
  });

  const removeAttachment = (id: string) => {
    if (readOnly) return;
    
    const updatedAttachments = attachments.filter(attachment => attachment.id !== id);
    onAttachmentsChange?.(updatedAttachments);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <Image className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const isImage = (type: string) => type.startsWith("image/");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Attachments
          {attachments.length > 0 && (
            <Badge variant="secondary">{attachments.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!readOnly && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            data-testid="dropzone-upload"
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-primary">Drop files here...</p>
            ) : (
              <div>
                <p className="font-medium">Drop files here or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Max {maxFiles} files, {formatFileSize(maxSizeBytes)} each
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported: Images, PDF, Word documents, Text files
                </p>
              </div>
            )}
          </div>
        )}

        {attachments.length > 0 && (
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 border rounded-lg"
                data-testid={`attachment-${attachment.id}`}
              >
                <div className="flex-shrink-0">
                  {getFileIcon(attachment.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" data-testid={`attachment-name-${attachment.id}`}>
                    {attachment.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(attachment.size)}
                    {attachment.uploadedAt && (
                      <span className="ml-2">
                        • {new Date(attachment.uploadedAt).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex gap-1">
                  {isImage(attachment.type) && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-preview-${attachment.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>{attachment.name}</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-96 overflow-auto">
                          <img
                            src={attachment.url}
                            alt={attachment.name}
                            className="w-full h-auto"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = attachment.url;
                      link.download = attachment.name;
                      link.click();
                    }}
                    data-testid={`button-download-${attachment.id}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>

                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(attachment.id)}
                      data-testid={`button-remove-${attachment.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {attachments.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            No attachments added yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}