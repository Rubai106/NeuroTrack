/**
 * Smart Revision Planner
 * Spaced repetition + emergency mode
 */
const RevisionPlan = require('../models/RevisionPlan');
const WeaknessEntry = require('../models/WeaknessEntry');

// Spaced repetition intervals (days)
const SPACED_INTERVALS = [1, 3, 7, 14, 30];

/**
 * Auto-generate a revision plan based on weaknesses and exam date
 */
const generateRevisionPlan = async ({ name, examDate, mode = 'normal', subjects }) => {
  const weaknesses = await WeaknessEntry.find().lean();

  const prioritized = weaknesses
    .map((w) => {
      const errorRate = w.totalAttempts > 0 ? w.wrongAttempts / w.totalAttempts : 0.5;
      const studyPenalty = Math.max(0, 1 - w.studyWeightHours / 10);
      const score = errorRate * 60 + studyPenalty * 40;
      return { ...w, weaknessScore: Math.round(score) };
    })
    .filter((w) => subjects ? subjects.includes(w.subject) : true)
    .sort((a, b) => b.weaknessScore - a.weaknessScore)
    .slice(0, mode === 'emergency' ? 10 : 20);

  const exam = examDate ? new Date(examDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const today = new Date();
  const daysAvailable = Math.max(1, Math.ceil((exam - today) / (1000 * 60 * 60 * 24)));

  const items = [];

  prioritized.forEach((weakness, index) => {
    const intervals = mode === 'emergency'
      ? [0, 1, 2] // review every day in emergency mode
      : SPACED_INTERVALS.slice(0, Math.min(3, Math.floor(daysAvailable / 3)));

    intervals.forEach((dayOffset, repetition) => {
      if (dayOffset < daysAvailable) {
        const scheduledDate = new Date(today);
        scheduledDate.setDate(scheduledDate.getDate() + dayOffset + Math.floor(index / 3));

        if (scheduledDate <= exam) {
          const nextInterval = SPACED_INTERVALS[repetition + 1] || 30;
          const nextReview = new Date(scheduledDate);
          nextReview.setDate(nextReview.getDate() + nextInterval);

          items.push({
            subject: weakness.subject,
            topic: weakness.topic,
            scheduledDate,
            durationMinutes: weakness.weaknessScore > 70 ? 60 : 30,
            priority: weakness.weaknessScore > 70 ? 'high' : weakness.weaknessScore > 40 ? 'medium' : 'low',
            repetitionNumber: repetition + 1,
            nextReviewDate: nextReview,
          });
        }
      }
    });
  });

  // Sort by date
  items.sort((a, b) => a.scheduledDate - b.scheduledDate);

  const plan = new RevisionPlan({ name, mode, examDate: exam, items, isActive: true });
  await plan.save();
  return plan;
};

module.exports = { generateRevisionPlan };
