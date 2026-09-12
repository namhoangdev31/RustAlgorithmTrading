"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronRight, Zap, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface QaLibraryProps {
  onSelectQuestion: (question: string) => void;
  onClose?: () => void;
}

export function QaLibraryPanel({ onSelectQuestion, onClose }: QaLibraryProps) {
  const t = useTranslations("Bfxps.qa");

  const [openSections, setOpenSections] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    3: true,
  });

  const QA_CATEGORIES = [
    {
      title: t("cat_core"),
      defaultOpen: true,
      questions: [
        { label: t("q_today_label"), q: t("q_today_text") },
        { label: t("q_current_label"), q: t("q_current_text") },
        { label: t("q_r5_label"), q: t("q_r5_text") },
        { label: t("q_range_label"), q: t("q_range_text") },
        { label: t("q_filled_label"), q: t("q_filled_text") },
        { label: t("q_v44_label"), q: t("q_v44_text") },
      ],
    },
    {
      title: t("cat_v44"),
      defaultOpen: true,
      questions: [
        { label: t("q_v44_long_label"), q: t("q_v44_long_text") },
        { label: t("q_v44_short_label"), q: t("q_v44_short_text") },
        { label: t("q_v44_train_label"), q: t("q_v44_train_text") },
        { label: t("q_v44_stmt_label"), q: t("q_v44_stmt_text") },
      ],
    },
    {
      title: t("cat_tp_sl"),
      defaultOpen: false,
      questions: [
        { label: t("q_cutloss_label"), q: t("q_cutloss_text") },
        { label: t("q_sl_label"), q: t("q_sl_text") },
        { label: t("q_tp_label"), q: t("q_tp_text") },
        { label: t("q_flip_label"), q: t("q_flip_text") },
        { label: t("q_review_label"), q: t("q_review_text") },
      ],
    },
    {
      title: t("cat_perf"),
      defaultOpen: true,
      questions: [
        { label: t("q_pnl30d_label"), q: t("q_pnl30d_text") },
        { label: t("q_perf30s_label"), q: t("q_perf30s_text") },
        { label: t("q_fresh_label"), q: t("q_fresh_text") },
        { label: t("q_source_label"), q: t("q_source_text") },
      ],
    },
  ];

  const toggleSection = (idx: number) => {
    setOpenSections((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#30363d] bg-[#171b23] text-[#e6edf3]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363d] bg-[#111722] px-4 py-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-[#2f81f7]" />
          <b className="text-sm tracking-wide text-white">{t("title")}</b>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#9aa4b2]">{t("click_to_run")}</span>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded p-1 text-[#8b949e] hover:bg-[#222833] hover:text-white transition-colors"
              title={t("close")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Body List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {QA_CATEGORIES.map((cat, idx) => {
          const isOpen = !!openSections[idx];
          return (
            <div
              key={idx}
              className="rounded-xl border border-[#30363d] bg-[#111722] overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleSection(idx)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs font-bold text-[#e6edf3] hover:bg-[#171b23]"
              >
                <span>{cat.title}</span>
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-[#9aa4b2]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-[#9aa4b2]" />
                )}
              </button>

              {isOpen && (
                <div className="grid grid-cols-1 gap-1.5 p-2.5 border-t border-[#30363d] bg-[#0d1117]">
                  {cat.questions.map((qItem, qIdx) => (
                    <button
                      key={qIdx}
                      type="button"
                      onClick={() => onSelectQuestion(qItem.q)}
                      className="group flex items-center justify-between rounded-lg border border-[#30363d] bg-[#171b23] px-2.5 py-1.5 text-left text-[11px] text-[#9aa4b2] transition-colors hover:border-[#2f81f7] hover:bg-[#1d2a3b] hover:text-white"
                    >
                      <span className="font-medium">{qItem.label}</span>
                      <Zap className="h-3 w-3 text-[#9aa4b2] opacity-0 group-hover:opacity-100 group-hover:text-[#2f81f7]" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
