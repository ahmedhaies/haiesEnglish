// Bilingual UI strings (Arabic + English). Learning content stays English;
// the interface speaks the user's language.
export const STRINGS = {
  ar: {
    dir: 'rtl', lang: 'ar', name: 'العربية',
    appName: 'هايس إنجلش', tagline: 'رحلتك اليومية لإتقان الإنجليزية',
    nav_home: 'الرئيسية', nav_learn: 'ذاكِر', nav_quiz: 'اختبار', nav_browse: 'الكلمات', nav_calendar: 'التقويم', nav_stats: 'إحصائياتي', nav_settings: 'الإعدادات', nav_achievements: 'الإنجازات',
    greeting_morning: 'صباح الخير', greeting_afternoon: 'مساء الخير', greeting_evening: 'مساء الخير', greeting_night: 'سهرة سعيدة',
    today_plan: 'خطة اليوم', new_words: 'كلمات جديدة', reviews: 'مراجعات', due_now: 'مستحقة الآن',
    start_session: 'ابدأ جلسة اليوم', continue_session: 'أكمل الجلسة', all_done_today: 'أنهيت مهمة اليوم! 🎉', review_more: 'راجع المزيد', learn_ahead: 'تعلّم كلمات إضافية',
    streak: 'أيام متتالية', day: 'يوم', days: 'أيام', longest: 'أطول سلسلة', xp: 'نقاط الخبرة', level: 'المستوى',
    learned: 'كلمات تعلمتها', mastered: 'أتقنتها', total_words: 'إجمالي الكلمات', remaining: 'المتبقي', progress: 'التقدّم',
    know: 'أعرفها', dont_know: 'لا أعرفها', again: 'كرّرها', hard: 'صعبة', good: 'جيدة', easy: 'سهلة', show_answer: 'اعرض المعنى', next: 'التالي', flip_hint: 'اضغط لقلب البطاقة',
    example: 'مثال', synonyms: 'مرادفات', meaning: 'المعنى', more_meanings: 'معانٍ أخرى', pronounce: 'استمع للنطق', part_of_speech: 'نوع الكلمة',
    quiz_title: 'اختبر نفسك', quiz_intro: 'اختر نوع الاختبار وابدأ', quiz_choose_meaning: 'اختر المعنى الصحيح', quiz_choose_word: 'اختر الكلمة الصحيحة', quiz_spelling: 'اكتب الكلمة', quiz_listening: 'اختبار الاستماع',
    quiz_today: 'كلمات اليوم', quiz_unit: 'اختبار وحدة', quiz_learned: 'كل ما تعلمته', quiz_start: 'ابدأ الاختبار', question: 'سؤال', of: 'من', correct: 'إجابة صحيحة', wrong: 'إجابة خاطئة', your_score: 'نتيجتك', quiz_again: 'أعد الاختبار', review_mistakes: 'راجع أخطاءك', type_here: 'اكتب هنا…', check: 'تحقّق', skip: 'تخطّى',
    units: 'الوحدات', unit: 'وحدة', words: 'كلمة', browse_all: 'كل الكلمات', search_placeholder: 'ابحث عن كلمة…', filter_all: 'الكل', filter_new: 'جديدة', filter_learning: 'قيد التعلّم', filter_learned: 'متعلّمة', filter_mastered: 'متقنة', no_results: 'لا توجد نتائج',
    nav_levels: 'المستويات', levels_title: 'رحلة التعلّم', overall_progress: 'التقدّم الكلي', study_level: 'ذاكر هذا المستوى', study_unit: 'ذاكر الوحدة', lessons: 'الدروس', lesson: 'درس', level_complete: 'مكتمل', level_current: 'الحالي', level_locked: 'مقفل', of_words: 'من', system_complete: 'أتممت كل المستويات! صرت تتقن الإنجليزية 🎓', system_complete_sub: 'أنجزت كل الكلمات الشائعة — إنجاز رائع!', continue_here: 'أكمل من هنا', complete_prev: 'أكمل المستوى السابق لفتح هذا', unlocked_level: 'فتحت مستوى جديدًا!',
    calendar_title: 'تقويم المذاكرة', this_month: 'هذا الشهر', active_days: 'أيام نشطة', calendar_legend_less: 'أقل', calendar_legend_more: 'أكثر', catch_up: 'تعويض', missed_days: 'أيام فائتة', catch_up_msg: 'لا تقلق! لديك مراجعات متراكمة. لنعوّضها معًا خطوة بخطوة.',
    stats_title: 'إحصائياتي', accuracy: 'دقة الإجابات', words_over_time: 'الكلمات عبر الوقت', activity: 'النشاط', time_studied: 'وقت المذاكرة', minutes: 'دقيقة', hours: 'ساعة', best_day: 'أفضل يوم', avg_per_day: 'المعدل اليومي', by_pos: 'حسب نوع الكلمة',
    achievements_title: 'إنجازاتك', unlocked: 'مفتوحة', locked: 'مقفلة', keep_going: 'استمر لفتح المزيد!',
    settings_title: 'الإعدادات', language: 'اللغة', theme: 'المظهر', theme_light: 'فاتح', theme_dark: 'داكن', theme_auto: 'تلقائي', words_per_day: 'كلمات جديدة في اليوم', reminders: 'التذكيرات', reminder_time: 'وقت التذكير', enable_reminders: 'تفعيل التذكير اليومي', sound: 'الأصوات', data: 'البيانات', export_data: 'تصدير تقدّمي', import_data: 'استيراد', reset_data: 'إعادة ضبط الكل', reset_confirm: 'هل أنت متأكد؟ سيتم حذف كل تقدّمك.', install_app: 'تثبيت التطبيق', about: 'حول التطبيق',
    encourage: [
      'أحسنت! كل كلمة تقربك أكثر 💪', 'استمر، أنت تتقدّم بثبات ✨', 'رائع! عقلك يزداد قوة 🧠',
      'مجهودك لا يضيع أبدًا 🌱', 'خطوة صغيرة كل يوم = فرق كبير 🚀', 'أنت أقوى مما تظن! 🔥',
      'المثابرة سرّ الإتقان 🏆', 'تعلّمك اليوم هدية لغدك 🎁',
    ],
    welcome_back: 'أهلًا بعودتك!', welcome_back_msg: 'اشتقنا لك. لنكمل من حيث توقفت.',
    goal_met: 'أنجزت هدف اليوم', words_to_go: 'كلمة لإنهاء اليوم', start_learning: 'ابدأ التعلّم', keep_streak: 'حافظ على سلسلتك',
    minutes_short: 'د', new_short: 'جديد', rev_short: 'مراجعة',
    loading: 'جارٍ تحضير كلماتك…', session_complete: 'اكتملت الجلسة!', session_summary: 'ملخّص الجلسة', words_reviewed: 'كلمة راجعتها', accuracy_session: 'دقتك', back_home: 'العودة للرئيسية', great: 'رائع!',
    day_streak_kept: 'سلسلتك مستمرة!', freeze_used: 'استُخدم تجميد للحفاظ على سلسلتك ❄️',
    tip: 'نصيحة', install_hint: 'ثبّت التطبيق على شاشتك الرئيسية للمذاكرة دون إنترنت.',
    close: 'إغلاق', save: 'حفظ', cancel: 'إلغاء', yes: 'نعم', no: 'لا',
    mark_known: 'أعرفها بالفعل', added_extra: 'كلمات إضافية أُضيفت', empty_queue: 'لا توجد كلمات مستحقة الآن — أحسنت! جرّب تعلّم كلمات جديدة أو اختبر نفسك.',
    correct_answer: 'الإجابة الصحيحة', tap_to_hear: 'اضغط للاستماع', level_up: 'ترقية للمستوى', new_badge: 'وسام جديد!',
  },
  en: {
    dir: 'ltr', lang: 'en', name: 'English',
    appName: 'Haies English', tagline: 'Your daily journey to English mastery',
    nav_home: 'Home', nav_learn: 'Learn', nav_quiz: 'Quiz', nav_browse: 'Words', nav_calendar: 'Calendar', nav_stats: 'Stats', nav_settings: 'Settings', nav_achievements: 'Badges',
    greeting_morning: 'Good morning', greeting_afternoon: 'Good afternoon', greeting_evening: 'Good evening', greeting_night: 'Good evening',
    today_plan: "Today's Plan", new_words: 'New words', reviews: 'Reviews', due_now: 'Due now',
    start_session: "Start today's session", continue_session: 'Continue session', all_done_today: "You're done for today! 🎉", review_more: 'Review more', learn_ahead: 'Learn extra words',
    streak: 'Day streak', day: 'day', days: 'days', longest: 'Longest streak', xp: 'XP', level: 'Level',
    learned: 'Words learned', mastered: 'Mastered', total_words: 'Total words', remaining: 'Remaining', progress: 'Progress',
    know: 'I know it', dont_know: "Don't know", again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy', show_answer: 'Show meaning', next: 'Next', flip_hint: 'Tap to flip the card',
    example: 'Example', synonyms: 'Synonyms', meaning: 'Meaning', more_meanings: 'Other meanings', pronounce: 'Listen', part_of_speech: 'Part of speech',
    quiz_title: 'Test yourself', quiz_intro: 'Pick a quiz type and go', quiz_choose_meaning: 'Choose the correct meaning', quiz_choose_word: 'Choose the correct word', quiz_spelling: 'Type the word', quiz_listening: 'Listening quiz',
    quiz_today: "Today's words", quiz_unit: 'Unit quiz', quiz_learned: 'Everything learned', quiz_start: 'Start quiz', question: 'Question', of: 'of', correct: 'Correct', wrong: 'Wrong', your_score: 'Your score', quiz_again: 'Retry quiz', review_mistakes: 'Review mistakes', type_here: 'Type here…', check: 'Check', skip: 'Skip',
    units: 'Units', unit: 'Unit', words: 'words', browse_all: 'All words', search_placeholder: 'Search a word…', filter_all: 'All', filter_new: 'New', filter_learning: 'Learning', filter_learned: 'Learned', filter_mastered: 'Mastered', no_results: 'No results',
    nav_levels: 'Levels', levels_title: 'Learning journey', overall_progress: 'Overall progress', study_level: 'Study this level', study_unit: 'Study unit', lessons: 'Lessons', lesson: 'Lesson', level_complete: 'Complete', level_current: 'Current', level_locked: 'Locked', of_words: 'of', system_complete: 'You finished every level — English mastered! 🎓', system_complete_sub: "You've learned all the common words — amazing achievement!", continue_here: 'Continue here', complete_prev: 'Finish the previous level to unlock', unlocked_level: 'New level unlocked!',
    calendar_title: 'Study calendar', this_month: 'This month', active_days: 'Active days', calendar_legend_less: 'Less', calendar_legend_more: 'More', catch_up: 'Catch up', missed_days: 'Missed days', catch_up_msg: "No worries! You have reviews piled up. Let's catch up together, step by step.",
    stats_title: 'My Stats', accuracy: 'Accuracy', words_over_time: 'Words over time', activity: 'Activity', time_studied: 'Time studied', minutes: 'min', hours: 'h', best_day: 'Best day', avg_per_day: 'Daily average', by_pos: 'By part of speech',
    achievements_title: 'Your badges', unlocked: 'Unlocked', locked: 'Locked', keep_going: 'Keep going to unlock more!',
    settings_title: 'Settings', language: 'Language', theme: 'Theme', theme_light: 'Light', theme_dark: 'Dark', theme_auto: 'Auto', words_per_day: 'New words per day', reminders: 'Reminders', reminder_time: 'Reminder time', enable_reminders: 'Enable daily reminder', sound: 'Sound', data: 'Data', export_data: 'Export progress', import_data: 'Import', reset_data: 'Reset everything', reset_confirm: 'Are you sure? All your progress will be erased.', install_app: 'Install app', about: 'About',
    encourage: [
      'Well done! Every word gets you closer 💪', "Keep going, you're making steady progress ✨", 'Great! Your brain is getting stronger 🧠',
      'Your effort never goes to waste 🌱', 'A small step each day = a big difference 🚀', "You're stronger than you think! 🔥",
      'Consistency is the secret to mastery 🏆', "Today's learning is a gift to your future 🎁",
    ],
    welcome_back: 'Welcome back!', welcome_back_msg: "We missed you. Let's pick up where you left off.",
    goal_met: "Today's goal met", words_to_go: 'words to finish today', start_learning: 'Start learning', keep_streak: 'Keep your streak',
    minutes_short: 'm', new_short: 'new', rev_short: 'review',
    loading: 'Preparing your words…', session_complete: 'Session complete!', session_summary: 'Session summary', words_reviewed: 'words reviewed', accuracy_session: 'accuracy', back_home: 'Back home', great: 'Great!',
    day_streak_kept: 'Your streak lives on!', freeze_used: 'A freeze was used to protect your streak ❄️',
    tip: 'Tip', install_hint: 'Install the app to your home screen to study offline.',
    close: 'Close', save: 'Save', cancel: 'Cancel', yes: 'Yes', no: 'No',
    mark_known: 'I already know it', added_extra: 'extra words added', empty_queue: "Nothing due right now — nice work! Try learning new words or testing yourself.",
    correct_answer: 'Correct answer', tap_to_hear: 'Tap to hear', level_up: 'Level up to', new_badge: 'New badge!',
  },
};

let current = 'ar';
export function setLang(l) { current = STRINGS[l] ? l : 'ar'; }
export function getLang() { return current; }
export function t(key) {
  const s = STRINGS[current] || STRINGS.ar;
  return s[key] !== undefined ? s[key] : (STRINGS.en[key] !== undefined ? STRINGS.en[key] : key);
}
