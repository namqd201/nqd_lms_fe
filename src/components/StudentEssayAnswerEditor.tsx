'use client';

import React, { useState, useRef, useEffect } from 'react';
import { mediaService } from '@/services/media.service';
import { RichMathEditor } from '@/components/RichMathEditor';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  ZoomIn,
  RotateCw,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Plus,
} from 'lucide-react';

interface UploadedWorkImage {
  id: string;
  url: string;
  caption: string;
}

interface StudentEssayAnswerEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  helperText?: string;
}

export const StudentEssayAnswerEditor: React.FC<StudentEssayAnswerEditorProps> = ({
  value,
  onChange,
  disabled = false,
  label = 'Bài làm tự luận của bạn',
  placeholder = 'Nhập ghi chú hoặc lời giải thích thêm nếu cần...',
  helperText,
}) => {
  const [images, setImages] = useState<UploadedWorkImage[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'photo' | 'type'>('photo');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Lightbox Modal state
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption: string } | null>(null);
  const [imageRotation, setImageRotation] = useState<number>(0);
  const [imageZoom, setImageZoom] = useState<number>(1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseAnswer = (val: string) => {
    if (!val) return { parsedImages: [], parsedNotes: '' };
    const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
    const parsedImages: UploadedWorkImage[] = [];
    let match;
    let counter = 1;
    while ((match = imgRegex.exec(val)) !== null) {
      parsedImages.push({
        id: `img-${counter}-${Date.now()}`,
        caption: match[1] || `Trang ${counter}`,
        url: match[2],
      });
      counter++;
    }
    const parsedNotes = val.replace(/!\[(.*?)\]\((.*?)\)/g, '').trim();
    return { parsedImages, parsedNotes };
  };

  useEffect(() => {
    const { parsedImages, parsedNotes } = parseAnswer(value || '');
    setImages(parsedImages);
    setNotes(parsedNotes);

    if (parsedImages.length === 0 && parsedNotes.trim().length > 0 && !parsedNotes.includes('![')) {
      setActiveTab('type');
    }
  }, [value]);

  const syncChanges = (newImages: UploadedWorkImage[], newNotes: string) => {
    setImages(newImages);
    setNotes(newNotes);

    const imgMarkdown = newImages
      .map((img, idx) => `![${img.caption || `Trang ${idx + 1}`}](${img.url})`)
      .join('\n\n');

    let combined = '';
    if (imgMarkdown && newNotes.trim()) {
      combined = `${imgMarkdown}\n\n${newNotes.trim()}`;
    } else if (imgMarkdown) {
      combined = imgMarkdown;
    } else {
      combined = newNotes.trim();
    }

    onChange(combined);
  };

  const handleUploadFiles = async (files: FileList | File[]) => {
    if (disabled || files.length === 0) return;
    setIsUploading(true);
    setUploadError(null);

    const uploadedNewImages: UploadedWorkImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        setUploadError(`Tệp "${file.name}" không phải là ảnh hợp lệ.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`Ảnh "${file.name}" vượt quá dung lượng tối đa 10MB.`);
        continue;
      }

      try {
        const res = await mediaService.uploadImage(file);
        if (res && res.url) {
          uploadedNewImages.push({
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            url: res.url,
            caption: `Trang ${images.length + uploadedNewImages.length + 1}`,
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Tải ảnh thất bại';
        setUploadError(`Lỗi tải ảnh "${file.name}": ${msg}`);
      }
    }

    if (uploadedNewImages.length > 0) {
      const updatedList = [...images, ...uploadedNewImages];
      syncChanges(updatedList, notes);
    }
    setIsUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (disabled) return;
    const updatedList = images.filter((_, idx) => idx !== indexToRemove);
    const reindexed = updatedList.map((img, idx) => ({
      ...img,
      caption: img.caption.startsWith('Trang ') ? `Trang ${idx + 1}` : img.caption,
    }));
    syncChanges(reindexed, notes);
  };

  const handleNotesChange = (newNotes: string) => {
    syncChanges(images, newNotes);
  };

  const handleRichEditorChange = (fullText: string) => {
    onChange(fullText);
    const { parsedImages, parsedNotes } = parseAnswer(fullText);
    setImages(parsedImages);
    setNotes(parsedNotes);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    const filesToUpload: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) filesToUpload.push(file);
      }
    }

    if (filesToUpload.length > 0) {
      e.preventDefault();
      handleUploadFiles(filesToUpload);
    }
  };

  const openLightbox = (img: UploadedWorkImage) => {
    setLightboxImage({ url: mediaService.getFullUrl(img.url), caption: img.caption });
    setImageRotation(0);
    setImageZoom(1);
  };

  return (
    <div className="space-y-3" onPaste={handlePaste}>
      {/* Header with Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
        <div>
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-indigo-600" />
            <span>{label}</span>
          </label>
          <p className="text-[11px] text-slate-500">
            {helperText || 'Bạn có thể chụp ảnh bài làm trong vở/giấy tải lên, hoặc gõ trực tiếp lời giải.'}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl gap-1 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('photo')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'photo'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-indigo-600" />
            <span>Chụp / Gửi ảnh bài làm</span>
            {images.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                {images.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('type')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'type'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>Gõ lời giải trên máy</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Photo Submission (Highlighted & Friendly for Students) */}
      {activeTab === 'photo' && (
        <div className="space-y-4">
          {/* Upload Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/70 scale-[1.01]'
                : images.length === 0
                ? 'border-indigo-300/80 bg-gradient-to-b from-indigo-50/40 via-white to-purple-50/30 hover:border-indigo-500 hover:bg-indigo-50/30'
                : 'border-slate-200 bg-slate-50/60 hover:border-indigo-300 hover:bg-slate-50'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={disabled || isUploading}
            />

            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                ) : (
                  <Camera className="w-6 h-6 text-indigo-600" />
                )}
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-800">
                  {isUploading
                    ? 'Đang tải ảnh bài làm lên hệ thống...'
                    : 'Bấm vào đây để Chọn ảnh hoặc Chụp ảnh bài làm'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Hỗ trợ chụp từ điện thoại, chọn file từ máy tính hoặc dán (Ctrl + V). Bạn có thể chọn nhiều ảnh nếu bài làm có nhiều trang!
                </p>
              </div>

              {!isUploading && !disabled && (
                <div className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Tải ảnh lên ({images.length} ảnh đã chọn)</span>
                </div>
              )}
            </div>
          </div>

          {/* Upload Error Alert */}
          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
              <button
                type="button"
                onClick={() => setUploadError(null)}
                className="text-rose-500 hover:text-rose-700 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Uploaded Images Gallery */}
          {images.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ảnh bài làm đã nộp ({images.length} trang)</span>
                </h5>
                <span className="text-[11px] text-slate-500">
                  Bấm vào ảnh để phóng to kiểm tra độ sắc nét
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="group relative bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl overflow-hidden shadow-xs transition flex flex-col"
                  >
                    {/* Header badge */}
                    <div className="px-2.5 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-indigo-700">{img.caption || `Trang ${idx + 1}`}</span>
                      {!disabled && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(idx);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition cursor-pointer"
                          title="Xóa ảnh này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Image Preview */}
                    <div
                      onClick={() => openLightbox(img)}
                      className="relative h-36 bg-slate-100 overflow-hidden cursor-zoom-in flex items-center justify-center group"
                    >
                      <img
                        src={mediaService.getFullUrl(img.url)}
                        alt={img.caption}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="p-2 bg-white/90 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1 shadow-md">
                          <ZoomIn className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Phóng to</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add More Photos Button Card */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-44 border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold">Thêm trang tiếp</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Optional Text Notes Area */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <span>Ghi chú thêm hoặc lời dặn cho giáo viên (tùy chọn)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              disabled={disabled}
              placeholder={placeholder}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition disabled:opacity-50"
            />
          </div>
        </div>
      )}

      {/* Mode 2: Full Math & Formula Editor (RichMathEditor) */}
      {activeTab === 'type' && (
        <div className="space-y-3">
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Mẹo: </span>
              Nếu câu hỏi có nhiều công thức phức tạp khó gõ trên máy, bạn có thể bấm nút{' '}
              <strong
                onClick={() => setActiveTab('photo')}
                className="underline cursor-pointer text-indigo-700 font-bold"
              >
                Chụp / Gửi ảnh bài làm
              </strong>{' '}
              ở trên để chụp ảnh bài làm từ vở và gửi lên nhanh chóng!
            </div>
          </div>

          <RichMathEditor
            value={value}
            onChange={handleRichEditorChange}
            disabled={disabled}
            placeholder="Trình bày chi tiết lời giải, sử dụng các ký hiệu toán lý trên thanh công cụ..."
            minRows={7}
            allowImageUpload={true}
          />
        </div>
      )}

      {/* Lightbox Modal for zooming in/out/rotating student work photos */}
      {lightboxImage && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-5xl w-full max-h-[95vh] flex flex-col bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
            {/* Lightbox Header */}
            <div className="p-4 px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span className="font-extrabold text-sm">{lightboxImage.caption}</span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition text-slate-200 cursor-pointer"
                  title="Xoay ảnh 90 độ"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Xoay ảnh</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImageZoom((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1))}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition text-slate-200 cursor-pointer"
                  title="Phóng to / Thu nhỏ"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Zoom ({Math.round(imageZoom * 100)}%)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image display */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[60vh] bg-slate-950">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.caption}
                style={{
                  transform: `rotate(${imageRotation}deg) scale(${imageZoom})`,
                  transition: 'transform 0.2s ease-in-out',
                }}
                className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
