/**
 * Smart Insights Service
 * Generates rule-based, data-driven insights from study patterns.
 * No ML — pure aggregation logic that feels intelligent.
 */
const StudySession = require('../models/StudySession');
const WeaknessEntry = require('../models/WeaknessEntry');
const Goal = require('../models/Goal');
const User = require('../models/User');
const mongoose = require('mongoose');

const toObjId = (id) => new mongoose.Types.ObjectId(id);

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOUR_LABELS = (h) => {
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
};

/**
 * Main entry point — returns an array of insight objects sorted by priority
 */
const generateInsights = async (userId) => {
  const uid = toObjId(userId);
  const sixtyAgo = new Date(); sixtyAgo.setDate(sixtyAgo.getDate() - 60);
  const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 30);
  const sevenAgo = new Date(); sevenAgo.setDate(sevenAgo.getDate() - 7);

  const [sessions, weaknesses, goals, user] = await Promise.all([
    StudySession.find({ userId: uid, date: { $gte: sixtyAgo } }).lean(),
    WeaknessEntry.find({ userId: uid }).lean(),
    Goal.find({ userId: uid, status: 'active' }).lean(),
    User.findById(userId).lean(),
  ]);

  if (sessions.length < 3) return [];

  const insights = [];

  // --- 1. Best day of week ---
  const byDay = Array(7).fill(null).map(() => ({ totalMins: 0, totalFocus: 0, count: 0 }));
  sessions.forEach(s => {
    const d = new Date(s.date).getDay();
    byDay[d].totalMins += s.durationMinutes;
    byDay[d].totalFocus += s.focusQuality;
    byDay[d].count += 1;
  });
  const dayScores = byDay.map((d, i) => ({
    day: i,
    name: DAY_NAMES[i],
    avgMins: d.count ? Math.round(d.totalMins / d.count) : 0,
    avgFocus: d.count ? Math.round((d.totalFocus / d.count) * 10) / 10 : 0,
    count: d.count,
  })).filter(d => d.count >= 2);

  if (dayScores.length >= 2) {
    const best = dayScores.reduce((a, b) => (a.avgMins + a.avgFocus * 10 > b.avgMins + b.avgFocus * 10 ? a : b));
    const worst = dayScores.reduce((a, b) => (a.avgMins + a.avgFocus * 10 < b.avgMins + b.avgFocus * 10 ? a : b));
    const diff = Math.round(((best.avgMins - worst.avgMins) / Math.max(worst.avgMins, 1)) * 100);
    if (diff > 15) {
      insights.push({
        id: 'best_day',
        type: 'pattern',
        icon: '📅',
        title: `${best.name}s are your best day`,
        detail: `You study ${diff}% longer with ${best.avgFocus}/10 avg focus — plan your hardest topics then.`,
        priority: 8,
      });
    }
  }

  // --- 2. Best hour of day ---
  const byHour = {};
  sessions.forEach(s => {
    const h = new Date(s.date).getHours();
    if (!byHour[h]) byHour[h] = { totalFocus: 0, totalMins: 0, count: 0 };
    byHour[h].totalFocus += s.focusQuality;
    byHour[h].totalMins += s.durationMinutes;
    byHour[h].count += 1;
  });
  const hourScores = Object.entries(byHour)
    .map(([h, d]) => ({ h: +h, avgFocus: d.totalFocus / d.count, avgMins: d.totalMins / d.count, count: d.count }))
    .filter(x => x.count >= 2)
    .sort((a, b) => b.avgFocus - a.avgFocus);

  if (hourScores.length >= 2) {
    const best = hourScores[0];
    const worst = hourScores[hourScores.length - 1];
    if (best.avgFocus - worst.avgFocus >= 1.5) {
      insights.push({
        id: 'best_hour',
        type: 'pattern',
        icon: '⏰',
        title: `Focus peaks at ${best.h}:00 (${HOUR_LABELS(best.h)})`,
        detail: `Your ${HOUR_LABELS(best.h)} sessions average ${best.avgFocus.toFixed(1)}/10 focus — ${Math.round(best.avgFocus - worst.avgFocus * 10) / 10} points above your ${HOUR_LABELS(worst.h)} average.`,
        priority: 7,
      });
    }
    // Focus drop after 9 PM
    const lateNight = Object.entries(byHour).filter(([h]) => +h >= 21);
    if (lateNight.length >= 2) {
      const lateAvg = lateNight.reduce((s, [, d]) => s + d.totalFocus / d.count, 0) / lateNight.length;
      const overallAvg = sessions.reduce((s, x) => s + x.focusQuality, 0) / sessions.length;
      if (overallAvg - lateAvg > 1.2) {
        insights.push({
          id: 'late_night_drop',
          type: 'warning',
          icon: '🌙',
          title: 'Focus drops after 9 PM',
          detail: `Late-night sessions average ${lateAvg.toFixed(1)}/10 vs your usual ${overallAvg.toFixed(1)}/10. Consider shifting study to earlier.`,
          priority: 9,
        });
      }
    }
  }

  // --- 3. Consistency insight ---
  const recentDays = sessions.filter(s => new Date(s.date) >= sevenAgo);
  const studiedDaysThisWeek = new Set(recentDays.map(s => new Date(s.date).toDateString())).size;
  if (studiedDaysThisWeek <= 3 && studiedDaysThisWeek > 0) {
    insights.push({
      id: 'consistency',
      type: 'warning',
      icon: '🔄',
      title: `Only ${studiedDaysThisWeek} study days this week`,
      detail: `Consistent daily sessions beat long irregular ones. Even 30 minutes daily compounds significantly.`,
      priority: 8,
    });
  } else if (studiedDaysThisWeek >= 6) {
    insights.push({
      id: 'consistency_great',
      type: 'positive',
      icon: '🔥',
      title: `Strong week — ${studiedDaysThisWeek}/7 days studied`,
      detail: `You're showing excellent consistency. Keep this rhythm through the weekend.`,
      priority: 4,
    });
  }

  // --- 4. Session length pattern ---
  const avgDuration = sessions.reduce((s, x) => s + x.durationMinutes, 0) / sessions.length;
  const longSessions = sessions.filter(s => s.durationMinutes >= 90);
  const shortSessions = sessions.filter(s => s.durationMinutes <= 20);
  if (shortSessions.length / sessions.length > 0.5) {
    insights.push({
      id: 'short_sessions',
      type: 'tip',
      icon: '⏱',
      title: 'Most sessions are under 20 minutes',
      detail: `Short sessions limit deep work. Aim for 45–90 minute focused blocks with proper breaks.`,
      priority: 6,
    });
  }

  // --- 5. Skip-revision pattern ---
  const withTopic = sessions.filter(s => s.sessionType === 'review' || s.topic);
  const lastRevision = withTopic.find(s => s.sessionType === 'review');
  if (lastRevision) {
    const daysSinceRevision = Math.floor((Date.now() - new Date(lastRevision.date)) / 86400000);
    if (daysSinceRevision > 4) {
      insights.push({
        id: 'skip_revision',
        type: 'warning',
        icon: '📖',
        title: `No revision in ${daysSinceRevision} days`,
        detail: `Spaced repetition breaks down without regular reviews. Schedule a 30-min revision session today.`,
        priority: 9,
      });
    }
  }

  // --- 6. Overconfidence detection ---
  const overconfident = weaknesses.filter(w => {
    const errorRate = w.totalAttempts > 0 ? w.wrongAttempts / w.totalAttempts : 0;
    return w.confidenceScore > 70 && errorRate > 0.4;
  });
  if (overconfident.length > 0) {
    insights.push({
      id: 'overconfidence',
      type: 'warning',
      icon: '⚠️',
      title: `Overconfidence detected in ${overconfident.length} topic${overconfident.length > 1 ? 's' : ''}`,
      detail: `${overconfident.map(w => w.topic).join(', ')} — you rate confidence highly but quiz results disagree. Test yourself again.`,
      priority: 10,
    });
  }

  // --- 7. Underconfidence detection ---
  const underconfident = weaknesses.filter(w => {
    const errorRate = w.totalAttempts > 0 ? w.wrongAttempts / w.totalAttempts : 1;
    return w.confidenceScore < 40 && errorRate < 0.25 && w.totalAttempts >= 5;
  });
  if (underconfident.length > 0) {
    insights.push({
      id: 'underconfidence',
      type: 'positive',
      icon: '💡',
      title: `You're better than you think at ${underconfident[0].topic}`,
      detail: `Your quiz accuracy is ${Math.round((1 - underconfident[0].wrongAttempts / underconfident[0].totalAttempts) * 100)}% but confidence is low. Trust the data.`,
      priority: 5,
    });
  }

  // --- 8. Momentum insight ---
  const lastWeekMins = sessions.filter(s => new Date(s.date) >= sevenAgo)
    .reduce((s, x) => s + x.durationMinutes, 0);
  const prevWeekStart = new Date(sevenAgo); prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekMins = sessions.filter(s => new Date(s.date) >= prevWeekStart && new Date(s.date) < sevenAgo)
    .reduce((s, x) => s + x.durationMinutes, 0);
  if (prevWeekMins > 0) {
    const change = Math.round(((lastWeekMins - prevWeekMins) / prevWeekMins) * 100);
    if (change >= 20) {
      insights.push({
        id: 'momentum_up',
        type: 'positive',
        icon: '📈',
        title: `Study time up ${change}% from last week`,
        detail: `${Math.round(lastWeekMins / 60)}h this week vs ${Math.round(prevWeekMins / 60)}h last week. Great momentum — maintain it.`,
        priority: 6,
      });
    } else if (change <= -25) {
      insights.push({
        id: 'momentum_down',
        type: 'warning',
        icon: '📉',
        title: `Study time down ${Math.abs(change)}% from last week`,
        detail: `${Math.round(lastWeekMins / 60)}h this week vs ${Math.round(prevWeekMins / 60)}h last week. What changed? Get back on track.`,
        priority: 8,
      });
    }
  }

  // --- 9. Subject neglect ---
  const recentSubjects = new Set(sessions.filter(s => new Date(s.date) >= sevenAgo).map(s => s.subject));
  const allSubjects = [...new Set(sessions.map(s => s.subject))];
  const neglected = allSubjects.filter(s => !recentSubjects.has(s));
  if (neglected.length > 0 && allSubjects.length > 2) {
    insights.push({
      id: 'neglected_subjects',
      type: 'tip',
      icon: '📚',
      title: `${neglected[0]} not studied this week`,
      detail: `You haven't touched ${neglected.slice(0, 2).join(' or ')} in 7+ days. Avoid letting gaps grow too wide.`,
      priority: 7,
    });
  }

  // --- 10. Streak praise / warning ---
  const streak = user?.currentStreak || 0;
  if (streak >= 7) {
    insights.push({
      id: 'streak_praise',
      type: 'positive',
      icon: '🏆',
      title: `${streak}-day streak — keep it alive`,
      detail: `You're in the top habit-builders. Missing one day now resets to zero — protect this streak.`,
      priority: 5,
    });
  } else if (streak === 0) {
    const lastSession = sessions[0];
    if (lastSession) {
      const daysSince = Math.floor((Date.now() - new Date(lastSession.date)) / 86400000);
      if (daysSince >= 2) {
        insights.push({
          id: 'streak_broken',
          type: 'warning',
          icon: '💔',
          title: `${daysSince} days since your last session`,
          detail: `Streaks are hard to restart. Even a 15-minute session today resets your momentum.`,
          priority: 10,
        });
      }
    }
  }

  return insights.sort((a, b) => b.priority - a.priority).slice(0, 6);
};

/**
 * Generate the Daily Study Brief — a 3-bullet morning plan
 */
const generateDailyBrief = async (userId) => {
  const uid = toObjId(userId);
  const sevenAgo = new Date(); sevenAgo.setDate(sevenAgo.getDate() - 7);

  const [sessions, weaknesses, goals, user] = await Promise.all([
    StudySession.find({ userId: uid, date: { $gte: sevenAgo } }).lean(),
    WeaknessEntry.find({ userId: uid }).lean(),
    Goal.find({ userId: uid, status: 'active' }).lean(),
    User.findById(userId).lean(),
  ]);

  const actions = [];

  // What to study: worst weakness not studied recently
  const scoredWeaknesses = weaknesses.map(w => {
    const er = w.totalAttempts > 0 ? w.wrongAttempts / w.totalAttempts : 0;
    const sp = Math.max(0, 1 - w.studyWeightHours / 10);
    const daysSince = w.lastTestedDate
      ? Math.floor((Date.now() - new Date(w.lastTestedDate)) / 86400000)
      : 99;
    return { ...w, score: er * 60 + sp * 40, daysSince };
  }).sort((a, b) => b.score - a.score);

  if (scoredWeaknesses.length > 0) {
    const top = scoredWeaknesses[0];
    actions.push({
      type: 'study',
      icon: '📖',
      text: `Revise ${top.topic} (${top.subject})`,
      reason: top.score > 60 ? 'critical weakness' : `not reviewed in ${top.daysSince}d`,
    });
  } else if (sessions.length > 0) {
    const subjects = [...new Set(sessions.map(s => s.subject))];
    const leastStudied = subjects[subjects.length - 1];
    actions.push({
      type: 'study',
      icon: '📖',
      text: `Continue with ${leastStudied}`,
      reason: 'least studied subject recently',
    });
  }

  // When to study: best hour from pattern
  const byHour = {};
  sessions.forEach(s => {
    const h = new Date(s.date).getHours();
    if (!byHour[h]) byHour[h] = { totalFocus: 0, count: 0 };
    byHour[h].totalFocus += s.focusQuality;
    byHour[h].count += 1;
  });
  const bestHour = Object.entries(byHour)
    .map(([h, d]) => ({ h: +h, avg: d.totalFocus / d.count }))
    .filter(x => byHour[x.h].count >= 2)
    .sort((a, b) => b.avg - a.avg)[0];

  const now = new Date().getHours();
  const suggestHour = bestHour ? bestHour.h : (now < 9 ? 9 : now < 14 ? 14 : 19);
  const displayHour = suggestHour > 12 ? `${suggestHour - 12}:00 PM` : `${suggestHour}:00 AM`;
  actions.push({
    type: 'timing',
    icon: '⏰',
    text: `Study at ${displayHour}`,
    reason: bestHour ? `your peak focus time` : 'good default time slot',
  });

  // Active goal progress
  if (goals.length > 0) {
    const urgent = goals.find(g => {
      const pct = Math.round((g.currentMinutes / g.targetMinutes) * 100);
      return pct < 50;
    }) || goals[0];
    const pct = Math.round((urgent.currentMinutes / urgent.targetMinutes) * 100);
    const remaining = urgent.targetMinutes - urgent.currentMinutes;
    actions.push({
      type: 'goal',
      icon: '🎯',
      text: `${Math.round(remaining / 60 * 10) / 10}h left for "${urgent.title}"`,
      reason: `${pct}% complete`,
    });
  }

  // Focus warning
  const recentSessions = sessions.slice(0, 5);
  if (recentSessions.length >= 3) {
    const avgFocus = recentSessions.reduce((s, x) => s + x.focusQuality, 0) / recentSessions.length;
    if (avgFocus < 6) {
      actions.push({
        type: 'focus',
        icon: '🧘',
        text: 'Keep distractions away today',
        reason: `recent focus avg is ${avgFocus.toFixed(1)}/10`,
      });
    }
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return {
    greeting,
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    actions: actions.slice(0, 3),
    streak: user?.currentStreak || 0,
    examDays: user?.examDate
      ? Math.max(0, Math.ceil((new Date(user.examDate) - new Date()) / 86400000))
      : null,
  };
};

/**
 * Build the Review Queue — top 3 topics to review today
 */
const getReviewQueue = async (userId) => {
  const weaknesses = await WeaknessEntry.find({ userId: new mongoose.Types.ObjectId(userId) }).lean();

  const scored = weaknesses.map(w => {
    const er = w.totalAttempts > 0 ? w.wrongAttempts / w.totalAttempts : 0.5;
    const sp = Math.max(0, 1 - w.studyWeightHours / 10);
    const daysSince = w.lastTestedDate
      ? Math.floor((Date.now() - new Date(w.lastTestedDate)) / 86400000)
      : 14;
    // Urgency: weakness + time gap (spaced repetition)
    const urgency = er * 40 + sp * 30 + Math.min(daysSince * 2, 30);
    return { ...w, urgency: Math.round(urgency), daysSince };
  }).sort((a, b) => b.urgency - a.urgency);

  return scored.slice(0, 3).map(w => ({
    _id: w._id,
    subject: w.subject,
    topic: w.topic,
    urgency: w.urgency,
    daysSince: w.daysSince,
    confidenceScore: w.confidenceScore,
    weaknessScore: Math.round(Math.min(100, (w.totalAttempts > 0 ? w.wrongAttempts / w.totalAttempts : 0.5) * 60 + Math.max(0, 1 - w.studyWeightHours / 10) * 40)),
  }));
};

module.exports = { generateInsights, generateDailyBrief, getReviewQueue };
