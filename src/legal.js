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
