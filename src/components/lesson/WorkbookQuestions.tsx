"use client";

import { useState, useEffect } from "react";
import { Book, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/components/AnalyticsContext";

interface WorkbookQuestionsProps {
  workbook: string | null;
  lessonId?: number | string;
  lessonTitle?: string;
}
const getQuestionCount = (workbook: string | null): number => {
  return workbook?.split("\n").filter((q) => q.trim() !== "").length || 0;
};

export default function WorkbookQuestions({
  workbook,
  lessonId,
  lessonTitle = "Lesson",
}: WorkbookQuestionsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { trackEvent } = useAnalytics();

  // Track when the workbook is first viewed
  useEffect(() => {
    if (workbook && workbook.trim() !== "" && lessonId) {
      const questionCount = getQuestionCount(workbook);

      trackEvent("workbook_viewed", {
        lesson_id: lessonId,
        lesson_title: lessonTitle,
        question_count: questionCount,
      });
    }
  }, [workbook, lessonId, lessonTitle]);

  // If no workbook content, don't render anything
  if (!workbook || workbook.trim() === "") {
    return null;
  }

  // Split the workbook content by newlines to get individual questions
  const questions = workbook
    .split("\n")
    .filter((question) => question.trim() !== "")
    .map((question, index) => (
      <li key={index} className="mb-3 text-gray-800">
        <div className="flex">
          <span>{question}</span>
        </div>
      </li>
    ));

  return (
    <div className="bg-amber-50 rounded-lg p-6 shadow-sm mb-6 border border-amber-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-amber-800 flex items-center">
          <Book size={20} className="mr-2" />
          Reflection Questions
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const newExpandedState = !isExpanded;
            setIsExpanded(newExpandedState);

            // Track when user expands the workbook
            if (newExpandedState && lessonId) {
              const questionCount = getQuestionCount(workbook);

              trackEvent("workbook_expanded", {
                lesson_id: lessonId,
                lesson_title: lessonTitle,
                question_count: questionCount,
              });
            }
          }}
          className="text-amber-700 hover:text-amber-900 hover:bg-amber-100"
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </Button>
      </div>

      {isExpanded && (
        <div className="mt-2">
          <p className="text-sm text-amber-700 mb-4">
            Reflect on these questions as you watch the video. You can write
            your answers in the notes section.
          </p>
          <ul className="list-none pl-2">{questions}</ul>
        </div>
      )}
    </div>
  );
}
