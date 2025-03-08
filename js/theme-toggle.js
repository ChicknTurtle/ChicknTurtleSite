document.addEventListener('navLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    const userPreference = localStorage.getItem('themePreference');

    function applyTheme(isDark, skipTransition = false) {
        if (skipTransition) body.style.transition = 'none';

        body.classList.toggle('dark-theme', isDark);

        themeToggle.src = isDark ? '/assets/images/dark-theme.png' : '/assets/images/light-theme.png';
        themeToggle.setAttribute('theme', isDark ? 'dark' : 'light');

        if (skipTransition) setTimeout(() => (body.style.transition = ''), 100);
    }

    function toggleDarkTheme() {
        const isDark = body.classList.toggle('dark-theme');
        localStorage.setItem('themePreference', isDark ? 'dark' : 'light');
        applyTheme(isDark);
    }

    if (userPreference) {
        applyTheme(userPreference === 'dark', true);
    } else {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(systemPrefersDark, true);
    }

    themeToggle.addEventListener('click', toggleDarkTheme);
});
