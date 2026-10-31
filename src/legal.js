import './style.css';

// Build table of contents from the h2 headings in .legal-content
const toc = document.getElementById('legal-toc');
const headings = document.querySelectorAll('.legal-content h2');

if (toc && headings.length) {
    const list = toc.querySelector('ol');
    headings.forEach((h, i) => {
        if (!h.id) h.id = 'section-' + (i + 1);
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#' + h.id;
        a.textContent = h.textContent;
        li.appendChild(a);
        list.appendChild(li);
    });
} else if (toc) {
    toc.remove();
}

document.getElementById('footer-year').textContent = new Date().getFullYear();

// Language menu (globe button); the links keep the query so ?event_until= survives a language switch
document.querySelectorAll('[data-lang-menu]').forEach(wrap => {
    const btn = wrap.querySelector('button');
    const menu = wrap.querySelector('div');
    menu.querySelectorAll('a').forEach(a => { a.search = window.location.search; });
    const close = () => { menu.classList.add('hidden'); btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', () => {
        btn.setAttribute('aria-expanded', String(!menu.classList.toggle('hidden')));
    });
    document.addEventListener('click', e => { if (!wrap.contains(e.target)) close(); });
});

// The app's event badge links here with ?event_until=<expires_at>, since mobile has no room for the date
const eventUntil = document.getElementById('event-until');
const until = new Date(new URLSearchParams(window.location.search).get('event_until') || NaN);
if (eventUntil && !isNaN(until)) {
    const date = new Intl.DateTimeFormat(document.documentElement.lang, { month: 'long', day: 'numeric' }).format(until);
    eventUntil.textContent = eventUntil.dataset.text.replace('{date}', date);
    eventUntil.classList.replace('hidden', 'block');
}
