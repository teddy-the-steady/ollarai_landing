import './style.css';
import './theme.js';
import { t, applyI18n, langSwitch, sitePath } from './beta/i18n.js';

// Thank-you page after a Pro payment (the payment provider's success URL). No ?lang= needed: i18n.js
// uses the language saved when checkout started on the pricing page (src/pricing.js), else the browser's.
// The content is static; the server activates Pro from the webhook.

document.title = t('thanks.page-title');
applyI18n();
// A note with no text in this language (ko has no activation delay) is left out
document.querySelectorAll('main li').forEach(li => { if (!li.textContent.trim()) li.remove(); });
langSwitch(document.getElementById('lang-switch'));
document.getElementById('home-link').href = sitePath('/');
