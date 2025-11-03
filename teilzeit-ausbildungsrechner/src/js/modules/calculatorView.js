/**
 * Liest alle Eingabewerte aus dem Formular aus.
 * @returns {object} - Ein Objekt mit allen Rohwerten.
 */
export function getFormInputs() {
    const selections = {};
    const reasonIds = [
        'age-select', 'school-finish', 'experience-select',
        'apprenticeship-select', 'study-select', 'child-care-select',
        'family-care-select'
    ];
    reasonIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) selections[id] = el.value;
    });
}