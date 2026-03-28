const StudySession = require('../models/StudySession');
const WeaknessEntry = require('../models/WeaknessEntry');
const Goal = require('../models/Goal');
const User = require('../models/User');
const mongoose = require('mongoose');

const getCoachResponse = async (userId, message) => {
  const uid = new mongoose.Types.ObjectId(userId);
  const msg = message.toLowerCase().trim();

  const [sessions, weaknesses, goals, user] = await Promise.all([
    StudySession.find({ userId: uid }).sort({ date: -1 }).limit(20),
    WeaknessEntry.find({ userId: uid }).lean(),
    Goal.find({ userId: uid, status: 'active' }),
    User.findById(userId)
  ]);

  const scored = weaknesses.map(w => {
    const er = w.totalAttempts > 0 ? w.wrongAttempts / w.totalAttempts : 0.5;
    const sp = Math.max(0, 1 - w.studyWeightHours / 10);
    return { ...w, score: Math.round(er * 60 + sp * 40) };
  }).sort((a,b) => b.score - a.score);

  const topWeak = scored[0];
  const todayMins = sessions
    .filter(s => new Date(s.date).toDateString() === new Date().toDateString())
    .reduce((s, x) => s + x.durationMinutes, 0);
  const recentSubjects = [...new Set(sessions.slice(0,5).map(s => s.subject))];
  const streak = user?.currentStreak || 0;

  // Intent routing
  if (/(what|which|suggest|next|should i study)/.test(msg)) {
    if (topWeak && topWeak.score > 50) {
      return { type: 'suggestion', text: `Your weakest area right now is **${topWeak.topic}** (${topWeak.subject}) with a weakness score of ${topWeak.score}/100. I'd recommend a 45-minute focused review session. Would you like a quick revision plan for it?` };
    }
    return { type: 'suggestion', text: `You've been studying ${recentSubjects.join(', ')} recently. Based on your schedule, a balanced review session covering your least-studied subjects would be ideal today.` };
  }

  if (/(how am i doing|progress|performance|stats)/.test(msg)) {
    const hrs = Math.round(sessions.reduce((s,x) => s+x.durationMinutes, 0) / 60 * 10) / 10;
    return { type: 'analysis', text: `Here's your current status:\n\n- **Total study time (recent):** ${hrs} hours\n- **Current streak:** ${streak} days\n- **Today's study time:** ${Math.round(todayMins)} minutes\n- **Weak topics:** ${scored.length > 0 ? scored.slice(0,3).map(w => w.topic).join(', ') : 'None detected yet'}\n\nOverall you're ${streak >= 3 ? 'showing great consistency' : 'still building your routine'}. Keep pushing!` };
  }

  if (/(burnout|tired|exhausted|break|rest)/.test(msg)) {
    return { type: 'wellbeing', text: `It sounds like you might be feeling overloaded. That's completely normal.\n\nHere's what I'd suggest:\n- Take a proper 15-20 minute break\n- Use the 5-minute breathing technique\n- Don't study for more than 90 minutes without a long break\n\nBurnout prevention is part of smart studying. Your ${streak}-day streak isn't worth losing to exhaustion.` };
  }

  if (/(plan|schedule|revision|prepare|exam)/.test(msg)) {
    const daysLeft = user?.examDate
      ? Math.ceil((new Date(user.examDate) - new Date()) / 86400000)
      : null;
    return {
      type: 'plan',
      text: daysLeft
        ? `With **${daysLeft} days** until your exam, here's a quick strategy:\n\n- Focus ${topWeak ? `on **${topWeak.topic}** first` : 'on your weakest subjects'}\n- Aim for 2–3 hour sessions with Pomodoro breaks\n- Do one full review quiz every 3 days to track progress\n- Keep your streak alive — consistency beats cramming every time.`
        : `Set your exam date in your profile and I can give you a personalized countdown plan! For now, focus on your weakest topics and maintain daily study habits.`
    };
  }

  if (/(hello|hi|hey|sup)/.test(msg)) {
    return { type: 'greeting', text: `Hey! I'm your NeuroTrack Study Coach 🧠\n\nI can help you with:\n- **What to study next** based on your weaknesses\n- **Performance analysis** and trend insights\n- **Revision planning** before exams\n- **Motivation** when you're feeling stuck\n\nWhat's on your mind today?` };
  }

  if (/(focus|distract|concentrate|pomodoro)/.test(msg)) {
    return { type: 'technique', text: `The best focus technique depends on your session length:\n\n- **Short tasks (< 30 min):** Time-box with a single focused sprint\n- **Medium tasks (30–90 min):** Pomodoro — 25 min work, 5 min break\n- **Deep work (90+ min):** 50/10 blocks — 50 min work, 10 min break\n\nAlso: close all notifications, put your phone face-down, and set an intention before you start. Small rituals wire your brain to focus.` };
  }

  // Default
  const activeGoal = goals[0];
  return {
    type: 'general',
    text: `I'm here to help! Currently you have ${goals.length} active goal(s)${activeGoal ? ` — "${activeGoal.title}" is your next milestone` : ''}.\n\nAsk me things like:\n- *"What should I study next?"*\n- *"How am I doing this week?"*\n- *"Help me plan for my exam"*\n- *"I'm feeling tired"*`
  };
};

module.exports = { getCoachResponse };
