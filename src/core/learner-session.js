const KEY = 'inclusive_learner_id';

export function getLearnerId() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
}
export function saveLearnerId(id) {
    try { localStorage.setItem(KEY, id); } catch (e) { /* storage blocked: carry on without saving */ }
}
export function clearLearnerId() {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
}