"use client";

import Image from "next/image";
import { MoreHorizontal, Send, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  type PostcardCommentFormValues,
  postcardCommentSchema,
} from "@/schemas/postcard-comment.schema";
import {
  useDeletePostcardComment,
  useUpdatePostcardComment,
} from "@/lib/queries/postcard-comment.mutation";
import { AppModal } from "@/components/ui/app-modal";

type PostcardComment = {
  id: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  status: "PUBLISHED" | "HIDDEN" | "DELETED";
  author: {
    id: string;
    nickname: string;
    avatarUrl?: string | null;
  };
};

type PostcardCommentSectionProps = {
  postcardId: string;
  comments: PostcardComment[];
  currentUser?: {
    id: string;
    nickname: string;
    avatarUrl?: string | null;
  } | null;
  isSubmitting?: boolean;
  onSubmit: (
    values: PostcardCommentFormValues,
    parentId?: string,
  ) => Promise<void> | void;
};

const formatCommentDate = (value: string) => {
  const date = new Date(value);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
  }).format(date);
};

function CommentAvatar({
  nickname,
  avatarUrl,
}: {
  nickname: string;
  avatarUrl?: string | null;
}) {
  return (
    <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-xs font-semibold text-cinemo-gold">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={`${nickname} 프로필 사진`}
          fill
          sizes="32px"
          className="object-cover"
        />
      ) : (
        <UserRound className="size-4" aria-hidden="true" />
      )}
    </div>
  );
}

type PostcardReplyFormProps = {
  replyToNickname: string;
  isSubmitting: boolean;
  onSubmit: (values: PostcardCommentFormValues) => Promise<void> | void;
  onCancel: () => void;
};

function PostcardReplyForm({
  replyToNickname,
  isSubmitting,
  onSubmit,
  onCancel,
}: PostcardReplyFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PostcardCommentFormValues>({
    resolver: zodResolver(postcardCommentSchema),
    defaultValues: {
      content: "",
    },
  });
  const submitLockRef = useRef(false);

  const handleReplySubmit = async (values: PostcardCommentFormValues) => {
    if (submitLockRef.current) {
      return;
    }

    submitLockRef.current = true;

    try {
      await onSubmit(values);
      reset();
      onCancel();
    } finally {
      submitLockRef.current = false;
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleReplySubmit)}
      className="mt-3 border-l-2 border-cinemo-gold/50 pl-3"
    >
      <p className="mb-2 text-xs text-cinemo-gold">
        {replyToNickname}에게 답글
      </p>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <textarea
        {...register("content")}
        disabled={isSubmitting}
        rows={2}
        autoFocus
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void handleSubmit(handleReplySubmit)();
          }
        }}
        placeholder="답글을 남겨보세요"
        className="w-full resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-white/35 disabled:cursor-not-allowed"
      />

      {errors.content?.type === "too_big" && (
        <p className="mt-1 text-xs text-red-300">
          {errors.content.message}
        </p>
      )}

      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg px-3 py-1.5 text-xs text-cinemo-muted disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-cinemo-gold px-3 py-1.5 text-xs font-semibold text-cinemo-bg disabled:opacity-50"
        >
          {isSubmitting ? "등록 중..." : "답글 등록"}
        </button>
      </div>
      </div>
    </form>
  );
}

export function PostcardCommentSection({
  postcardId,
  comments,
  currentUser,
  isSubmitting = false,
  onSubmit,
}: PostcardCommentSectionProps) {
  const [expandedCommentIds, setExpandedCommentIds] = useState<Set<string>>(
    new Set(),
  );
  const [openCommentMenuId, setOpenCommentMenuId] = useState<string | null>(
    null,
  );
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [deleteTargetCommentId, setDeleteTargetCommentId] = useState<
    string | null
  >(null);
  const openCommentMenuRef = useRef<HTMLDivElement | null>(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!openCommentMenuId) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !openCommentMenuRef.current?.contains(event.target)
      ) {
        setOpenCommentMenuId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenCommentMenuId(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openCommentMenuId]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PostcardCommentFormValues>({
    resolver: zodResolver(postcardCommentSchema),
    defaultValues: {
      content: "",
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<PostcardCommentFormValues>({
    resolver: zodResolver(postcardCommentSchema),
    defaultValues: {
      content: "",
    },
  });
  const submitLockRef = useRef(false);

  const handleFormSubmit = async (values: PostcardCommentFormValues) => {
    if (submitLockRef.current) {
      return;
    }

    submitLockRef.current = true;

    try {
      await onSubmit(values);
      reset();
    } finally {
      submitLockRef.current = false;
    }
  };
  const deleteCommentMutation = useDeletePostcardComment();
  const updateCommentMutation = useUpdatePostcardComment();
  const handleDeleteComment = async () => {
    if (!deleteTargetCommentId) {
      return;
    }

    try {
      await deleteCommentMutation.mutateAsync({
        postcardId,
        commentId: deleteTargetCommentId,
      });
      setDeleteTargetCommentId(null);
    } catch {
      setDeleteTargetCommentId(null);
    }
  };

  const handleUpdateComment = async (values: PostcardCommentFormValues) => {
    if (!editingCommentId) {
      return;
    }

    await updateCommentMutation.mutateAsync({
      postcardId,
      commentId: editingCommentId,
      input: values,
    });

    setEditingCommentId(null);
    resetEdit();
  };

  const orderedComments = useMemo(() => {
    const commentsByParent = new Map<string | null, PostcardComment[]>();

    for (const comment of comments) {
      const siblings = commentsByParent.get(comment.parentId) ?? [];
      siblings.push(comment);
      commentsByParent.set(comment.parentId, siblings);
    }

    const ordered: PostcardComment[] = [];
    const visited = new Set<string>();

    const appendThread = (parentId: string | null) => {
      for (const comment of commentsByParent.get(parentId) ?? []) {
        if (visited.has(comment.id)) {
          continue;
        }

        visited.add(comment.id);
        ordered.push(comment);
        appendThread(comment.id);
      }
    };

    appendThread(null);

    // 부모가 다른 페이지에 있어도 댓글이 사라지지 않도록 마지막에 보존함
    for (const comment of comments) {
      if (!visited.has(comment.id)) {
        visited.add(comment.id);
        ordered.push(comment);
      }
    }

    return ordered;
  }, [comments]);

  return (
    <section className="mt-4 pt-4">
      <h2 className="text-sm font-semibold text-white">
        댓글 <span className="text-cinemo-muted">{comments.length}</span>
      </h2>

      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#102322]/90 p-3 shadow-[0_1rem_3rem_rgb(0_0_0_/24%)] backdrop-blur-xl transition-colors focus-within:border-cinemo-gold/50"
      >
        {currentUser ? (
          <CommentAvatar
            nickname={currentUser.nickname}
            avatarUrl={currentUser.avatarUrl}
          />
        ) : (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-cinemo-muted">
            <UserRound className="size-4" aria-hidden="true" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <textarea
            {...register("content")}
            disabled={!currentUser || isSubmitting}
            rows={1}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSubmit(handleFormSubmit)();
              }
            }}
            onInput={(event) => {
              const textarea = event.currentTarget;
              textarea.style.height = "0px";
              textarea.style.height = `${textarea.scrollHeight}px`;
            }}
            placeholder={
              currentUser
                ? "댓글을 남겨보세요"
                : "로그인 후 댓글을 남길 수 있습니다."
            }
            className="min-h-8 w-full resize-none overflow-hidden bg-transparent py-1.5 text-sm leading-6 text-white outline-none placeholder:text-white/35 disabled:cursor-not-allowed"
          />

          {errors.content?.type === "too_big" && (
            <p className="mt-1 text-xs text-red-300">
              {errors.content.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!currentUser || isSubmitting}
          aria-label="댓글 등록"
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-cinemo-gold transition-colors hover:bg-cinemo-gold/10 disabled:opacity-30"
        >
          <Send className="size-4" aria-hidden="true" />
        </button>
      </form>

      <div className="mt-5 space-y-5">
        {comments.length > 0 ? (
          orderedComments.map((comment) => {
            const isExpanded = expandedCommentIds.has(comment.id);
            const canExpand = comment.content.length > 40;

            return (
              <article
                key={comment.id}
                className={`flex gap-3 ${
                  comment.parentId
                    ? "ml-5 border-l border-cinemo-gold/35 pl-4"
                    : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-haspopup="dialog"
                      aria-label={`${comment.author.nickname} 프로필 열기`}
                      className="inline-flex min-w-0 items-center gap-2 text-left transition-colors hover:text-cinemo-gold"
                    >
                      <CommentAvatar
                        nickname={comment.author.nickname}
                        avatarUrl={comment.author.avatarUrl}
                      />

                      <strong className="truncate text-sm text-white">
                        {comment.author.nickname}
                      </strong>
                    </button>

                    <time
                      dateTime={comment.createdAt}
                      className="text-xs text-cinemo-muted"
                    >
                      {formatCommentDate(comment.createdAt)}
                    </time>
                    {comment.status === "PUBLISHED" &&
                      currentUser?.id === comment.author.id && (
                      <div
                        ref={
                          openCommentMenuId === comment.id
                            ? openCommentMenuRef
                            : undefined
                        }
                        className="relative ml-auto"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenCommentMenuId((current) =>
                              current === comment.id ? null : comment.id,
                            )
                          }
                          aria-label="댓글 메뉴"
                          aria-expanded={openCommentMenuId === comment.id}
                          className="flex size-7 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <MoreHorizontal
                            className="size-4"
                            aria-hidden="true"
                          />
                        </button>

                        {openCommentMenuId === comment.id && (
                          <div className="absolute bottom-8 right-0 z-30 w-24 rounded-xl border border-white/10 bg-[#102322] p-1 shadow-xl">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenCommentMenuId(null);
                                setEditingCommentId(comment.id);
                                resetEdit({ content: comment.content });
                              }}
                              className="block w-full rounded-lg px-3 py-2 text-left text-xs text-white/80 hover:bg-white/10"
                            >
                              수정하기
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenCommentMenuId(null);
                                setDeleteTargetCommentId(comment.id);
                              }}
                              disabled={deleteCommentMutation.isPending}
                              className="block w-full rounded-lg px-3 py-2 text-left text-xs text-red-300 hover:bg-red-400/10 disabled:opacity-50"
                            >
                              삭제하기
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {editingCommentId === comment.id ? (
                    <form
                      onSubmit={handleEditSubmit(handleUpdateComment)}
                      className="mt-2 space-y-2"
                    >
                      <textarea
                        {...registerEdit("content")}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-cinemo-gold/40 bg-white/5 p-3 text-sm leading-6 text-white outline-none"
                      />

                      {editErrors.content?.type === "too_big" && (
                        <p className="text-xs text-red-300">
                          {editErrors.content.message}
                        </p>
                      )}

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(null);
                            resetEdit();
                          }}
                          className="rounded-lg px-3 py-1.5 text-xs text-cinemo-muted"
                        >
                          취소
                        </button>

                        <button
                          type="submit"
                          disabled={updateCommentMutation.isPending}
                          className="rounded-lg bg-cinemo-gold px-3 py-1.5 text-xs font-semibold text-cinemo-bg"
                        >
                          {updateCommentMutation.isPending
                            ? "저장 중..."
                            : "저장"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p
                        className={`mt-2 whitespace-pre-wrap text-sm leading-6 text-white/75 ${
                          !isExpanded ? "line-clamp-3" : ""
                        }`}
                      >
                        {comment.content}
                      </p>

                      {canExpand && (
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedCommentIds((current) => {
                              const next = new Set(current);

                              if (next.has(comment.id)) {
                                next.delete(comment.id);
                              } else {
                                next.add(comment.id);
                              }

                              return next;
                            });
                          }}
                          aria-expanded={isExpanded}
                          className="mt-1 text-xs text-cinemo-gold transition-colors hover:text-cinemo-gold-light"
                        >
                          {isExpanded ? "접기" : "더보기"}
                        </button>
                      )}

                      {currentUser && (
                        <button
                          type="button"
                          onClick={() => setReplyingToCommentId(comment.id)}
                          className="mt-2 text-xs text-cinemo-muted transition-colors hover:text-cinemo-gold"
                        >
                          답글
                        </button>
                      )}

                      {replyingToCommentId === comment.id && currentUser && (
                        <PostcardReplyForm
                          replyToNickname={comment.author.nickname}
                          isSubmitting={isSubmitting}
                          onSubmit={(values) => onSubmit(values, comment.id)}
                          onCancel={() => setReplyingToCommentId(null)}
                        />
                      )}
                    </>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <p className="py-4 text-sm text-cinemo-muted">
            아직 댓글이 없습니다. 첫 댓글 어떠신가요?
          </p>
        )}
      </div>

      <AppModal
        open={deleteTargetCommentId !== null}
        onOpenChange={(open) => {
          if (!open && !deleteCommentMutation.isPending) {
            setDeleteTargetCommentId(null);
          }
        }}
        title="댓글 삭제"
        description="댓글을 삭제하겠습니까? 답글이 있으면 삭제된 댓글로 표시됩니다."
        showCloseButton={false}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteTargetCommentId(null)}
              disabled={deleteCommentMutation.isPending}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-cinemo-muted disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteComment()}
              disabled={deleteCommentMutation.isPending}
              className="rounded-lg bg-red-500/80 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {deleteCommentMutation.isPending ? "삭제 중..." : "삭제하기"}
            </button>
          </>
        }
      />
    </section>
  );
}
