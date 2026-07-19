// Badges grid — unlocked and locked, to reinforce progress and motivation.
import { t, getLang } from '../i18n.js';
import { store } from '../store.js';
import { BADGES, badgeName, badgeDesc } from '../achievements.js';

export function render(root) {
  const lang = getLang();
  const unlocked = BADGES.filter((b) => store.s.achievements[b.id]).length;
  root.innerHTML = `
    <div class="section-title"><h2>${t('achievements_title')}</h2><span class="muted">${unlocked}/${BADGES.length} ${t('unlocked')}</span></div>
    <div class="card card-p" style="margin-bottom:16px;background:var(--grad);color:#fff;text-align:center">
      <div style="font-size:40px">🏅</div>
      <b style="font-size:1.3rem;font-family:var(--font-head)">${unlocked} ${t('unlocked')}</b>
      <div style="opacity:.9;font-size:.9rem">${t('keep_going')}</div>
    </div>
    <div class="badges-grid">
      ${BADGES.map((b) => {
        const on = !!store.s.achievements[b.id];
        return `<div class="badge ${on ? 'unlocked' : 'locked'}">
          <span class="badge-ic">${on ? b.icon : '🔒'}</span>
          <b>${badgeName(b, lang)}</b>
          <span>${badgeDesc(b, lang)}</span>
        </div>`;
      }).join('')}
    </div>`;
}
