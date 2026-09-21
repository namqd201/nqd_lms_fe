'use client';

import React, { useState } from 'react';
import { marketplaceService } from '@/services/marketplace.service';
import { formatErrorMessage } from '@/utils/errorMessage';
import { Star, X, Loader2, AlertCircle } from 'lucide-react';

import { CourseReviewResponse } from '@/types/marketplace';

interface CourseReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
  existingReview?: CourseReviewResponse | null;
  onSuccess?: () => void;
}

export const CourseReviewModal: React.FC<CourseReviewModalProps> = ({
  isOpen,
  onClose,
  courseId,
  courseName,
  existingReview,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>(existingReview?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setRating(existingReview?.rating || 5);
      setComment(existingReview?.comment || '');
      setErrorMsg(null);
    }
  }, [isOpen, existingReview]);

  if (!isOpen) return null;

  const isEditing = !!existingReview?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      if (isEditing) {
        await marketplaceService.updateReview(courseId, existingReview.id, {
          rating,
          comment: comment.trim() || undefined,
        });
      } else {
        await marketplaceService.createReview(courseId, {
          rating,
          comment: comment.trim() || undefined,
        });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, isEditing ? 'Không thể cập nhật đánh giá' : 'Không thể gửi đánh giá'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              {isEditing ? 'Chỉnh sửa đánh giá' : 'Đánh giá khóa học'}
            </h3>
            <p className="text-xs text-slate-500 truncate max-w-[280px]">{courseName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Star Rating selector */}
          <div className="flex flex-col items-center justify-center gap-2 py-2">
            <span className="text-xs font-semibold text-slate-600">Bạn đánh giá khóa học này mấy sao?</span>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-amber-400 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        filled ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-50'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-bold text-amber-600">
              {rating === 5 && '🌟 Tuyệt vời! Rất hài lòng'}
              {rating === 4 && '👍 Rất tốt! Hài lòng'}
              {rating === 3 && '👌 Tương đối tốt'}
              {rating === 2 && '😐 Cần cải thiện thêm'}
              {rating === 1 && '👎 Chưa hài lòng'}
            </span>
          </div>

          {/* Comment input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Nhận xét chi tiết (tùy chọn)
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ cảm nhận của bạn về chất lượng bài giảng, sự hỗ trợ của giảng viên..."
              className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEditing ? 'Lưu thay đổi' : 'Gửi đánh giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseReviewModal;