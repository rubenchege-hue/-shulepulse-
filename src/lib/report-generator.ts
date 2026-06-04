import { createClient } from "@/lib/supabase/client";

export interface ReportContent {
  generatedAt: string;
  student: {
    id: string;
    name: string;
    admissionNumber: string;
    className: string | null;
  };
  term: {
    name: string;
    year: number;
  };
  academic: {
    subjects: {
      name: string;
      scores: {
        assessmentName: string;
        type: string;
        date: string;
        score: number;
        maxScore: number;
        grade: string;
      }[];
      average: number;
      totalScore: number;
      totalMaxScore: number;
      grade: string;
    }[];
    overallAverage: number;
    overallGrade: string;
  };
  cbc: {
    subjects: {
      name: string;
      strands: {
        name: string;
        subStrands: {
          name: string;
          rating: string;
          ratingLabel: string;
          notes: string | null;
          date: string;
        }[];
      }[];
    }[];
  };
  cocurricular: {
    activities: {
      name: string;
      category: string;
      progressLevel: string;
      levelLabel: string;
      achievements: string | null;
      notes: string | null;
      date: string;
    }[];
  };
  summary: {
    totalAssessments: number;
    cbcRatingsCount: number;
    coCurricularCount: number;
    strengths: string[];
    areasForImprovement: string[];
  };
}

function getGradeLabel(grade: string): string {
  if (grade.startsWith("A")) return "Excellent";
  if (grade.startsWith("B")) return "Good";
  if (grade.startsWith("C")) return "Average";
  if (grade.startsWith("D")) return "Below Average";
  return "Needs Improvement";
}

function getCbcRatingLabel(rating: string): string {
  const labels: Record<string, string> = {
    E: "Exceeding Expectations",
    B: "Meeting Expectations",
    A: "Approaching Expectations",
    P: "Below Expectations",
  };
  return labels[rating] || rating;
}

function getProgressLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    beginner: "Beginner",
    developing: "Developing",
    competent: "Competent",
    excellent: "Excellent",
    outstanding: "Outstanding",
  };
  return labels[level] || level;
}

function computeGrade(score: number, maxScore: number): string {
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

export async function generateReportContent(
  studentId: string,
  academicTermId: string
): Promise<ReportContent> {
  const supabase = createClient();

  // Fetch student info
  const { data: student } = await supabase
    .from("students")
    .select("id, first_name, last_name, admission_number, classes!left(name)")
    .eq("id", studentId)
    .single();

  // Fetch term info
  const { data: term } = await supabase
    .from("academic_terms")
    .select("name, academic_year")
    .eq("id", academicTermId)
    .single();

  // Fetch assessment scores for this student + term
  const { data: assessments } = await supabase
    .from("assessments")
    .select(
      `
      id, name, type, date, max_score, subjects(name),
      assessment_scores!inner(score, grade, student_id)
    `
    )
    .eq("academic_term_id", academicTermId)
    .filter("assessment_scores.student_id", "eq", studentId);

  // Fetch CBC competency records
  const { data: cbcRecords } = await supabase
    .from("cbc_competency_records")
    .select(
      `
      id, rating, notes, date,
      sub_strand:cbc_sub_strands!inner(
        name,
        strand:cbc_strands!inner(name, subjects!inner(name))
      )
    `
    )
    .eq("student_id", studentId)
    .eq("academic_term_id", academicTermId);

  // Fetch co-curricular records
  const { data: cocurricularRecords } = await supabase
    .from("co_curricular_records")
    .select(
      `
      id, progress_level, achievements, notes, date,
      activity:co_curricular_activities!inner(name, category)
    `
    )
    .eq("student_id", studentId)
    .eq("academic_term_id", academicTermId);

  // Build academic section
  const subjectMap: Record<string, ReportContent["academic"]["subjects"][0]> = {};

  (assessments || []).forEach((a: any) => {
    const subjectName = a.subjects?.name || "General";
    const scoreEntry = a.assessment_scores?.[0];
    if (!scoreEntry) return;

    if (!subjectMap[subjectName]) {
      subjectMap[subjectName] = {
        name: subjectName,
        scores: [],
        average: 0,
        totalScore: 0,
        totalMaxScore: 0,
        grade: "",
      };
    }

    const grade = scoreEntry.grade || computeGrade(scoreEntry.score, a.max_score);
    subjectMap[subjectName].scores.push({
      assessmentName: a.name,
      type: a.type,
      date: a.date,
      score: scoreEntry.score,
      maxScore: a.max_score,
      grade,
    });
    subjectMap[subjectName].totalScore += scoreEntry.score;
    subjectMap[subjectName].totalMaxScore += a.max_score;
  });

  const academicSubjects = Object.values(subjectMap).map((subj) => {
    const avg =
      subj.totalMaxScore > 0
        ? (subj.totalScore / subj.totalMaxScore) * 100
        : 0;
    return {
      ...subj,
      average: Math.round(avg * 10) / 10,
      grade: computeGrade(subj.totalScore, subj.totalMaxScore),
    };
  });

  const overallTotalScore = academicSubjects.reduce(
    (sum, s) => sum + s.totalScore,
    0
  );
  const overallTotalMaxScore = academicSubjects.reduce(
    (sum, s) => sum + s.totalMaxScore,
    0
  );
  const overallAverage =
    overallTotalMaxScore > 0
      ? (overallTotalScore / overallTotalMaxScore) * 100
      : 0;

  // Build CBC section
  const cbcSubjectMap: Record<
    string,
    ReportContent["cbc"]["subjects"][0]
  > = {};

  (cbcRecords || []).forEach((r: any) => {
    const subjectName = r.sub_strand?.strand?.subjects?.name || "General";
    const strandName = r.sub_strand?.strand?.name || "General";

    if (!cbcSubjectMap[subjectName]) {
      cbcSubjectMap[subjectName] = { name: subjectName, strands: [] };
    }

    let strand = cbcSubjectMap[subjectName].strands.find(
      (s) => s.name === strandName
    );
    if (!strand) {
      strand = { name: strandName, subStrands: [] };
      cbcSubjectMap[subjectName].strands.push(strand);
    }

    strand.subStrands.push({
      name: r.sub_strand?.name || "Unknown",
      rating: r.rating,
      ratingLabel: getCbcRatingLabel(r.rating),
      notes: r.notes,
      date: r.date,
    });
  });

  // Build co-curricular section
  const cocurricularActivities = (cocurricularRecords || []).map((r: any) => ({
    name: r.activity?.name || "Unknown",
    category: r.activity?.category || "other",
    progressLevel: r.progress_level,
    levelLabel: getProgressLevelLabel(r.progress_level),
    achievements: r.achievements,
    notes: r.notes,
    date: r.date,
  }));

  // Summary
  const strengths: string[] = [];
  const areasForImprovement: string[] = [];

  academicSubjects.forEach((subj) => {
    if (subj.average >= 70) {
      strengths.push(`${subj.name}: ${subj.average.toFixed(0)}% (${subj.grade})`);
    } else if (subj.average < 50 && subj.scores.length > 0) {
      areasForImprovement.push(`${subj.name}: ${subj.average.toFixed(0)}% — needs improvement`);
    }
  });

  cbcRecords?.forEach((r: any) => {
    if (r.rating === "E") {
      strengths.push(
        `CBC ${r.sub_strand?.strand?.subjects?.name || ""}: ${r.sub_strand?.strand?.name || ""} - ${r.sub_strand?.name || ""} (Exceeding)`
      );
    }
    if (r.rating === "P") {
      areasForImprovement.push(
        `CBC ${r.sub_strand?.strand?.subjects?.name || ""}: ${r.sub_strand?.strand?.name || ""} - ${r.sub_strand?.name || ""} (Below Expectations)`
      );
    }
  });

  cocurricularActivities.forEach((a) => {
    if (a.progressLevel === "outstanding" || a.progressLevel === "excellent") {
      strengths.push(`Co-curricular: ${a.name} (${a.levelLabel})`);
    }
  });

  return {
    generatedAt: new Date().toISOString(),
    student: {
      id: studentId,
      name: `${student?.first_name || ""} ${student?.last_name || ""}`.trim(),
      admissionNumber: student?.admission_number || "",
      className: (student as any)?.classes?.name || null,
    },
    term: {
      name: term?.name || "",
      year: term?.academic_year || 0,
    },
    academic: {
      subjects: academicSubjects,
      overallAverage: Math.round(overallAverage * 10) / 10,
      overallGrade: computeGrade(overallTotalScore, overallTotalMaxScore || 1),
    },
    cbc: {
      subjects: Object.values(cbcSubjectMap),
    },
    cocurricular: {
      activities: cocurricularActivities,
    },
    summary: {
      totalAssessments: (assessments || []).length,
      cbcRatingsCount: (cbcRecords || []).length,
      coCurricularCount: (cocurricularRecords || []).length,
      strengths: strengths.slice(0, 5),
      areasForImprovement: areasForImprovement.slice(0, 5),
    },
  };
}
