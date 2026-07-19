# حايس إنجلش · Haies English

> رحلة يومية ممتعة لتعلّم أكثر من **8,500 كلمة إنجليزية شائعة** (أمريكية) — مع شرح إنجليزي لكل كلمة، أمثلة، نطق صوتي، مراجعة ذكية، اختبارات، تتبّع كامل للتقدّم، تقويم، وتحفيز يومي.
>
> A delightful daily journey to learn **8,500+ common American‑English words** — English definitions, examples, audio pronunciation, spaced‑repetition review, quizzes, full progress tracking, a study calendar, and daily motivation.

**موقع ثابت 100%** — يعمل على GitHub Pages مجانًا، بدون خادم وبدون حساب. كل تقدّمك محفوظ على جهازك، ويعمل بدون إنترنت بعد أول زيارة (PWA).

---

## ✨ المميزات · Features

- **8,500+ كلمة** مرتّبة حسب شيوعها في الإنجليزية الأمريكية، لكل كلمة:
  - شرح إنجليزي واضح (المعنى الأكثر شيوعًا أولًا، من WordNet)، وغالبًا معانٍ إضافية.
  - جملة مثال، مرادفات، النطق الصوتي (IPA + نطق حقيقي عبر متصفحك)، ورمز تعبيري للكلمات المحسوسة.
- **مراجعة ذكية (Spaced Repetition)** بخوارزمية SM‑2 — تُعيد الكلمة في الوقت المثالي قبل أن تنساها.
- **جلسة يومية** تمزج الكلمات الجديدة بالمراجعات المستحقّة، مع هدف يومي قابل للتعديل.
- **اختبارات متنوّعة**: اختيار المعنى، اختيار الكلمة، والتهجئة — على كلماتك الأخيرة أو على وحدة محدّدة أو على كل ما تعلّمته.
- **تتبّع كامل**: سلسلة أيام (streak) مع «تجميد» للأيام الفائتة، نقاط خبرة ومستويات، أوسمة/إنجازات، تقويم شهري وخريطة نشاط، وإحصائيات ورسوم بيانية.
- **تحفيز**: احتفالات، رسائل تشجيع، وتعويض لطيف عند الانقطاع.
- **تصميم عصري**: خطوط Google (Noto Sans / Noto Sans Arabic)، حركات سلسة، وضع فاتح/داكن، ودعم كامل للعربية (RTL) والإنجليزية.
- **يعمل على الموبايل والكمبيوتر**، وقابل للتثبيت كتطبيق (PWA) والعمل دون إنترنت.

---

## 🗂️ بنية المشروع · Structure

```
index.html            صفحة التطبيق
css/styles.css         نظام التصميم الكامل
js/                    منطق التطبيق (وحدات ES، بدون خطوة بناء)
  app.js  router.js  store.js  srs.js  session.js  data.js
  speech.js  reminders.js  achievements.js  ui.js  fx.js  i18n.js
  views/  home · learn · quiz · browse · calendar · stats · achievements · settings
data/
  words.json           قاعدة الكلمات (8,500)
  emoji.json           خريطة الكلمة → رمز تعبيري
  manifest.json        بيانات وصفية
scripts/               أدوات بناء البيانات (Python)
sw.js                  Service Worker للعمل دون إنترنت
manifest.webmanifest   بيان تطبيق الويب
```

## 🔤 مصادر البيانات · Data sources (all open / permissive)

| المصدر | الاستخدام |
|---|---|
| **WordNet 3.0** (Princeton) | التعريفات والأمثلة والمرادفات، مرتّبة حسب شيوع المعنى |
| **wordset-dictionary** (MIT) | تعريفات احتياطية |
| **google-10000-english (USA)** + **hermitdave/FrequencyWords `en_50k`** | ترتيب الشيوع |
| **michmech/lemmatization-lists** | ردّ الصيغ إلى أصلها |
| **open-dict-data/ipa-dict** (en_US) | النطق (IPA) |
| **muan/emojilib** | الرموز التعبيرية |
| كلمات وظيفية مُعدّة يدويًا (`scripts/curated.json`) | تعريفات مبسّطة للكلمات الشائعة جدًا |

### إعادة بناء البيانات · Rebuilding the data

```bash
# نزّل المصادر (مرة واحدة) ثم:
python3 scripts/build_data.py  --src <sources-dir> --out data
python3 scripts/build_emoji.py --src <sources-dir> --out data
```
راجع الترويسة في كل سكربت لروابط المصادر.

## 🚀 التشغيل محليًا · Run locally

```bash
python3 -m http.server 8000
# افتح http://localhost:8000
```
(وحدات ES تتطلب تشغيله عبر خادم، لا عبر `file://`.)

## 📄 الترخيص · License

كود التطبيق متاح بحرية للاستخدام التعليمي. تُنسب البيانات المعجمية لمصادرها أعلاه (WordNet، wordset، وغيرها) بحسب تراخيصها.
