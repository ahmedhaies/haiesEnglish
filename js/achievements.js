// Achievement definitions + evaluation. Called after study/quiz actions.
import { store } from './store.js';
import { levelFromXp } from './util.js';

export const BADGES = [
  { id: 'first_step', icon: '🌱', ar: 'أول خطوة', en: 'First Step', arDesc: 'تعلّمت أول كلمة', enDesc: 'Learned your first word', test: (c) => c.seen >= 1 },
  { id: 'w10', icon: '🔟', ar: 'عشر كلمات', en: 'Ten Words', arDesc: 'تعلّمت 10 كلمات', enDesc: 'Learned 10 words', test: (c) => c.seen >= 10 },
  { id: 'w50', icon: '📖', ar: 'خمسون كلمة', en: 'Fifty Words', arDesc: 'تعلّمت 50 كلمة', enDesc: 'Learned 50 words', test: (c) => c.seen >= 50 },
  { id: 'w100', icon: '💯', ar: 'مئة كلمة', en: 'Century', arDesc: 'تعلّمت 100 كلمة', enDesc: 'Learned 100 words', test: (c) => c.seen >= 100 },
  { id: 'w250', icon: '🎓', ar: 'ربع ألف', en: '250 Words', arDesc: 'تعلّمت 250 كلمة', enDesc: 'Learned 250 words', test: (c) => c.seen >= 250 },
  { id: 'w500', icon: '🏅', ar: 'خمسمئة', en: '500 Words', arDesc: 'تعلّمت 500 كلمة', enDesc: 'Learned 500 words', test: (c) => c.seen >= 500 },
  { id: 'w1000', icon: '🏆', ar: 'ألف كلمة', en: '1000 Words', arDesc: 'تعلّمت 1000 كلمة!', enDesc: 'Learned 1000 words!', test: (c) => c.seen >= 1000 },
  { id: 'w2500', icon: '👑', ar: 'سيّد المفردات', en: 'Vocab Master', arDesc: 'تعلّمت 2500 كلمة', enDesc: 'Learned 2500 words', test: (c) => c.seen >= 2500 },
  { id: 'm100', icon: '💎', ar: 'إتقان', en: 'Mastery', arDesc: 'أتقنت 100 كلمة', enDesc: 'Mastered 100 words', test: (c) => c.mastered >= 100 },
  { id: 'streak3', icon: '🔥', ar: 'ثلاثة أيام', en: '3-Day Streak', arDesc: '3 أيام متتالية', enDesc: '3 days in a row', test: (c, s) => s.streak.current >= 3 || s.streak.longest >= 3 },
  { id: 'streak7', icon: '⚡', ar: 'أسبوع كامل', en: 'Week Warrior', arDesc: '7 أيام متتالية', enDesc: '7 days in a row', test: (c, s) => s.streak.longest >= 7 },
  { id: 'streak30', icon: '🌟', ar: 'شهر من الالتزام', en: 'Monthly Legend', arDesc: '30 يومًا متتالية', enDesc: '30 days in a row', test: (c, s) => s.streak.longest >= 30 },
  { id: 'streak100', icon: '☄️', ar: 'مئة يوم', en: 'Unstoppable', arDesc: '100 يوم متتالية', enDesc: '100 days in a row', test: (c, s) => s.streak.longest >= 100 },
  { id: 'level5', icon: '🚀', ar: 'المستوى الخامس', en: 'Level 5', arDesc: 'وصلت للمستوى 5', enDesc: 'Reached level 5', test: (c, s) => levelFromXp(s.xp).level >= 5 },
  { id: 'level10', icon: '🛸', ar: 'المستوى العاشر', en: 'Level 10', arDesc: 'وصلت للمستوى 10', enDesc: 'Reached level 10', test: (c, s) => levelFromXp(s.xp).level >= 10 },
  { id: 'perfect', icon: '🎯', ar: 'اختبار مثالي', en: 'Perfect Quiz', arDesc: 'حصلت على 100% في اختبار', enDesc: 'Scored 100% on a quiz', test: (c, s) => Object.values(s.quizzes).some((q) => q.best >= 100) },
  { id: 'unit_master', icon: '🧩', ar: 'إتقان وحدة', en: 'Unit Cleared', arDesc: 'أتممت اختبار وحدة بتفوق', enDesc: 'Aced a full unit quiz', test: (c, s) => Object.entries(s.quizzes).some(([k, q]) => k.startsWith('unit') && q.best >= 90) },
  { id: 'comeback', icon: '❤️‍🩹', ar: 'العودة القوية', en: 'Comeback', arDesc: 'عدت بعد انقطاع وأكملت', enDesc: 'Returned after a break', test: (c, s) => (s._comeback === true) },
];

export function checkBadges() {
  const c = store.counts();
  const newly = [];
  for (const b of BADGES) {
    if (!store.s.achievements[b.id] && b.test(c, store.s)) {
      if (store.unlock(b.id)) newly.push(b);
    }
  }
  return newly;
}

export function badgeName(b, lang) { return lang === 'ar' ? b.ar : b.en; }
export function badgeDesc(b, lang) { return lang === 'ar' ? b.arDesc : b.enDesc; }
