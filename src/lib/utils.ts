import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
  }).format(new Date(date));
}

export function formatScore(score: number, maxScore: number = 100): string {
  return `${score.toFixed(0)}/${maxScore.toFixed(0)}`;
}

export function computeGrade(score: number, maxScore: number = 100): string {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 80) return "A";
  if (percentage >= 75) return "A-";
  if (percentage >= 70) return "B+";
  if (percentage >= 65) return "B";
  if (percentage >= 60) return "B-";
  if (percentage >= 55) return "C+";
  if (percentage >= 50) return "C";
  if (percentage >= 45) return "C-";
  if (percentage >= 40) return "D+";
  if (percentage >= 35) return "D";
  if (percentage >= 30) return "D-";
  return "E";
}

export function computeCbcRating(score: number): string {
  if (score >= 80) return "E"; // Exceeding Expectations
  if (score >= 60) return "B"; // Meeting Expectations
  if (score >= 40) return "A"; // Approaching Expectations
  return "P"; // Below Expectations
}

export function getCbcRatingLabel(rating: string): string {
  const labels: Record<string, string> = {
    E: "Exceeding Expectations",
    B: "Meeting Expectations",
    A: "Approaching Expectations",
    P: "Below Expectations",
  };
  return labels[rating] || rating;
}

export function getProgressLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    beginner: "Beginner",
    developing: "Developing",
    competent: "Competent",
    excellent: "Excellent",
    outstanding: "Outstanding",
  };
  return labels[level] || level;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
