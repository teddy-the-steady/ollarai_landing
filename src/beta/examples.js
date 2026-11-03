import { api } from './api.js';

// Example questions under the question box, one per group picked at random on each page load, all from
// GET /examples: worded by the backend from the newest filings and checked on Quick the night before
// (ollarai_backend common/example_questions.py), {group: [question, ...]}. No list of our own - when the
// server has none or can't be reached, no chips are shown.

const pick = (list) => list[Math.floor(Math.random() * list.length)];

// Chips under the question box - fewer than the groups, so each load shows a different mix
const SHOWN = 4;

// One question from each of SHOWN random groups, in group order; [] when the server has none
export async function exampleQuestions(lang) {
    const groups = await api(`/examples?lang=${lang}`).then(data => data?.groups || {}).catch(() => ({}));
    const lists = Object.values(groups).filter(questions => questions?.length);
    while (lists.length > SHOWN) lists.splice(Math.floor(Math.random() * lists.length), 1);
    return lists.map(pick);
}
