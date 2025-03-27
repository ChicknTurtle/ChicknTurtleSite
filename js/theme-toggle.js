document.addEventListener('navLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const userPreference = localStorage.getItem('themePreference');

    function applyTheme(isDark, skipTransition = false) {
        const main = document.querySelector('main');
        main.style.transition = skipTransition ? 'none' : 'background-color 0.2s ease, color 0.2s ease';

        document.body.classList.toggle('dark-theme', isDark);

        themeToggle.src = isDark ? '/assets/images/dark-theme.png' : '/assets/images/light-theme.png';
        themeToggle.setAttribute('theme', isDark ? 'dark' : 'light');

        if (skipTransition) setTimeout(() => (document.body.style.transition = ''), 100);
    }

    function toggleDarkTheme() {
        const isDark = document.body.classList.toggle('dark-theme');
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
