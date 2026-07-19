// Settings: language, theme, daily goal, reminders, sound, data management.
import { t, getLang, setLang } from '../i18n.js';
import { store } from '../store.js';
import { ICONS } from '../icons.js';
import { manifest } from '../data.js';
import { toast } from '../fx.js';
import { requestReminder } from '../reminders.js';

const refreshChrome = () => window.dispatchEvent(new CustomEvent('app:refresh'));
const applyChrome = () => window.dispatchEvent(new CustomEvent('app:theme'));

export function render(root) {
  const lang = getLang();
  const s = store.settings;
  root.innerHTML = `
    <div class="section-title"><h2>${t('settings_title')}</h2></div>

    <div class="card card-p">
      <div class="row"><div><div class="label">${t('language')}</div></div>
        <div class="segment" id="lang">
          <button data-v="ar" class="${lang === 'ar' ? 'on' : ''}">العربية</button>
          <button data-v="en" class="${lang === 'en' ? 'on' : ''}">English</button>
        </div></div>
      <div class="row"><div><div class="label">${t('theme')}</div></div>
        <div class="segment" id="theme">
          <button data-v="light" class="${s.theme === 'light' ? 'on' : ''}">${t('theme_light')}</button>
          <button data-v="dark" class="${s.theme === 'dark' ? 'on' : ''}">${t('theme_dark')}</button>
          <button data-v="auto" class="${s.theme === 'auto' ? 'on' : ''}">${t('theme_auto')}</button>
        </div></div>
      <div class="row"><div><div class="label">${t('words_per_day')}</div><div class="sub">${lang === 'ar' ? 'كلمات جديدة لكل جلسة' : 'new words each session'}</div></div>
        <div class="stepper"><button data-wpd="-1">−</button><b id="wpd">${s.wordsPerDay}</b><button data-wpd="1">+</button></div></div>
      <div class="row"><div><div class="label">${t('sound')}</div><div class="sub">${lang === 'ar' ? 'نطق الكلمات' : 'word pronunciation'}</div></div>
        <div class="switch ${s.sound ? 'on' : ''}" id="sound"></div></div>
    </div>

    <div class="section-title"><h2>${t('reminders')}</h2></div>
    <div class="card card-p">
      <div class="row"><div><div class="label">${t('enable_reminders')}</div><div class="sub">${lang === 'ar' ? 'تنبيه لطيف للمذاكرة' : 'a gentle nudge to study'}</div></div>
        <div class="switch ${s.reminderEnabled ? 'on' : ''}" id="rem"></div></div>
      <div class="row"><div><div class="label">${t('reminder_time')}</div></div>
        <input type="time" class="textinput" id="remtime" value="${s.reminderTime}" /></div>
    </div>

    <div class="section-title"><h2>${t('data')}</h2></div>
    <div class="card card-p">
      <div class="row"><div class="label">${t('install_app')}</div><button class="btn btn-soft" id="install">${ICONS.download} ${t('install_app')}</button></div>
      <div class="row"><div class="label">${t('export_data')}</div><button class="btn btn-ghost" id="export">${t('export_data')}</button></div>
      <div class="row"><div class="label">${t('import_data')}</div><button class="btn btn-ghost" id="import">${t('import_data')}</button></div>
      <div class="row"><div class="label" style="color:var(--danger)">${t('reset_data')}</div><button class="btn btn-ghost" id="reset" style="color:var(--danger)">${t('reset_data')}</button></div>
    </div>

    <div class="card card-p" style="margin-top:16px;text-align:center">
      <div class="brand" style="justify-content:center"><svg viewBox="0 0 64 64" width="34" height="34"><rect x="4" y="4" width="56" height="56" rx="16" fill="#6366f1"/><path d="M20 44V20h5v9h14v-9h5v24h-5V34H25v10z" fill="#fff"/></svg><span class="brand-name"><b>${t('appName')}</b></span></div>
      <p class="muted" style="font-size:.84rem;margin-top:6px">${manifest().total || 8500}+ ${t('words')} · WordNet · ${manifest().builtAt || ''}</p>
      <p class="muted" style="font-size:.8rem">${lang === 'ar' ? 'كل بياناتك محفوظة على جهازك فقط.' : 'All your data is stored on your device only.'}</p>
    </div>
    <input type="file" id="importfile" accept="application/json" hidden />
  `;

  // language
  seg(root, 'lang', (v) => { setLang(v); store.settings.lang = v; store.save(); applyChrome(); render(root); });
  seg(root, 'theme', (v) => { store.settings.theme = v; store.save(); applyChrome(); });
  // words per day
  root.querySelectorAll('[data-wpd]').forEach((b) => b.addEventListener('click', () => {
    store.settings.wordsPerDay = Math.max(5, Math.min(40, store.settings.wordsPerDay + (+b.dataset.wpd) * 5));
    root.querySelector('#wpd').textContent = store.settings.wordsPerDay; store.save();
  }));
  // sound
  toggle(root, 'sound', 'sound');
  // reminders
  const rem = root.querySelector('#rem');
  rem.addEventListener('click', async () => {
    if (!store.settings.reminderEnabled) {
      const ok = await requestReminder();
      if (!ok) { toast(getLang() === 'ar' ? 'لم يُسمح بالإشعارات' : 'Notifications not allowed', { icon: '🔕' }); return; }
    }
    store.settings.reminderEnabled = !store.settings.reminderEnabled;
    rem.classList.toggle('on', store.settings.reminderEnabled); store.save();
  });
  root.querySelector('#remtime').addEventListener('change', (e) => { store.settings.reminderTime = e.target.value; store.save(); });

  // data
  root.querySelector('#install').addEventListener('click', () => window.dispatchEvent(new CustomEvent('app:install')));
  root.querySelector('#export').addEventListener('click', () => {
    const blob = new Blob([store.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `haies-english-progress-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    toast(getLang() === 'ar' ? 'تم التصدير' : 'Exported', { icon: '💾' });
  });
  const file = root.querySelector('#importfile');
  root.querySelector('#import').addEventListener('click', () => file.click());
  file.addEventListener('change', () => {
    const f = file.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { try { store.importJSON(r.result); toast(getLang() === 'ar' ? 'تم الاستيراد' : 'Imported', { icon: '✅' }); refreshChrome(); render(root); } catch { toast('Error', { icon: '⚠️' }); } };
    r.readAsText(f);
  });
  root.querySelector('#reset').addEventListener('click', () => {
    if (confirm(t('reset_confirm'))) { store.reset(); refreshChrome(); toast(getLang() === 'ar' ? 'تمت إعادة الضبط' : 'Reset done', { icon: '🔄' }); render(root); }
  });

  function seg(scope, id, cb) {
    const el = scope.querySelector('#' + id);
    el.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => cb(b.dataset.v)));
  }
  function toggle(scope, id, key) {
    const el = scope.querySelector('#' + id);
    el.addEventListener('click', () => { store.settings[key] = !store.settings[key]; el.classList.toggle('on', store.settings[key]); store.save(); });
  }
}
