(function () {
    'use strict';

    const STORAGE_KEY = 'abysslasea-language';
    const DEFAULT_LANGUAGE = 'zh-CN';
    const translations = {
        'zh-CN': {
            'meta.title': 'AbyssLasea 个人主页',
            'meta.description': 'AbyssLasea 的个人主页。',
            'nav.label': '个人主页链接',
            'mountain.label': '暮色中的层叠雪山',
            'hero.intro': '你好！我是',
            'scroll.label': '继续向下浏览',
            'scroll.text': '下滑',
            'about.kicker': '关于我',
            'about.greeting': '你好，我是',
            'about.lead': '自称是 Game Developer 的人。',
            'about.body': '我制作 Game Mod 和一些 Mini Game，最近正在使用 Godot 引擎制作 3D Game。多多期待！',
            'about.linkLabel': '访问 AbyssLasea 的 Bilibili 主页',
            'about.avatarAlt': 'AbyssLasea 的头像',
            'friends.title': '我的朋友',
            'friends.shankaRole': '游戏开发者 · SpeedRunner',
            'friends.shankaNote': '知识学爆 👍 · 暂时没有更多介绍（',
            'friends.shankaLink': '访问闪卡ShanKa的 Bilibili 主页',
            'friends.shankaAlt': '闪卡ShanKa 的头像',
            'friends.didaRole': '24 岁，是学生',
            'friends.didaNote': '交友须带三分侠气，做人须存一点素心。',
            'friends.didaLink': '访问滴答滴的 Bilibili 主页',
            'friends.didaAlt': '滴答滴的头像',
            'friends.lunaticRole': '300 英雄大手子',
            'friends.lunaticNote': '任务成瘾。',
            'friends.lunaticLink': '访问 Lunatic 的 Bilibili 主页',
            'friends.lunaticAlt': 'Lunatic 的头像',
            'footer.copyright': '© 2026 AbyssLasea',
            'language.switchLabel': 'Switch to English',
            'language.next': 'EN'
        },
        en: {
            'meta.title': 'AbyssLasea Personal Site',
            'meta.description': "AbyssLasea's personal homepage",
            'nav.label': 'Profile links',
            'mountain.label': 'Layered snowy mountains at dusk',
            'hero.intro': "hi! i'm",
            'scroll.label': 'Continue scrolling',
            'scroll.text': 'SCROLL',
            'about.kicker': 'ABOUT ME',
            'about.greeting': "Hi, I'm",
            'about.lead': 'A self-proclaimed game developer.',
            'about.body': 'I make game mods and small games. Recently, I have been building a 3D game with Godot. Stay tuned!',
            'about.linkLabel': "Visit AbyssLasea's Bilibili profile",
            'about.avatarAlt': "AbyssLasea's avatar",
            'friends.title': 'My Friends',
            'friends.shankaRole': 'Game Developer · Speedrunner',
            'friends.shankaNote': 'Learning everything 👍 · No further introduction for now (',
            'friends.shankaLink': "Visit 闪卡ShanKa's Bilibili profile",
            'friends.shankaAlt': "闪卡ShanKa's avatar",
            'friends.didaRole': '24 years old · Student',
            'friends.didaNote': 'Bring a little chivalry to friendship and keep a little simplicity in life.',
            'friends.didaLink': "Visit 滴答滴's Bilibili profile",
            'friends.didaAlt': "滴答滴's avatar",
            'friends.lunaticRole': '300 Heroes expert',
            'friends.lunaticNote': 'Addicted to quests.',
            'friends.lunaticLink': "Visit Lunatic's Bilibili profile",
            'friends.lunaticAlt': "Lunatic's avatar",
            'footer.copyright': '© 2026 AbyssLasea',
            'language.switchLabel': '切换到中文',
            'language.next': '中'
        }
    };

    const normalizeLanguage = (language) => {
        if (typeof language !== 'string') return null;
        const normalized = language.toLowerCase();
        if (normalized.startsWith('zh')) return 'zh-CN';
        if (normalized.startsWith('en')) return 'en';
        return null;
    };

    const readStoredLanguage = () => {
        try {
            return normalizeLanguage(window.localStorage.getItem(STORAGE_KEY));
        } catch (_error) {
            return null;
        }
    };

    const detectLanguage = () => {
        const storedLanguage = readStoredLanguage();
        if (storedLanguage) return storedLanguage;

        const browserLanguages = Array.isArray(navigator.languages) && navigator.languages.length
            ? navigator.languages
            : [navigator.language];

        for (const language of browserLanguages) {
            const normalized = normalizeLanguage(language);
            if (normalized) return normalized;
        }

        return DEFAULT_LANGUAGE;
    };

    let currentLanguage = detectLanguage();
    const getText = (key) => translations[currentLanguage][key] || translations[DEFAULT_LANGUAGE][key] || key;

    const applyLanguage = (language, remember) => {
        currentLanguage = normalizeLanguage(language) || DEFAULT_LANGUAGE;
        document.documentElement.lang = currentLanguage;
        document.title = getText('meta.title');

        document.querySelectorAll('[data-i18n]').forEach((element) => {
            element.textContent = getText(element.dataset.i18n);
        });

        document.querySelectorAll('[data-i18n-content]').forEach((element) => {
            element.setAttribute('content', getText(element.dataset.i18nContent));
        });

        document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
            element.setAttribute('aria-label', getText(element.dataset.i18nAriaLabel));
        });

        document.querySelectorAll('[data-i18n-alt]').forEach((element) => {
            element.setAttribute('alt', getText(element.dataset.i18nAlt));
        });

        const toggle = document.getElementById('languageToggle');
        if (toggle) {
            const label = getText('language.switchLabel');
            toggle.setAttribute('aria-label', label);
            toggle.setAttribute('title', label);
            const current = toggle.querySelector('.language-current');
            if (current) current.textContent = getText('language.next');
        }

        if (!remember) return;

        try {
            window.localStorage.setItem(STORAGE_KEY, currentLanguage);
        } catch (_error) {
            // The selection still works for this page view when storage is unavailable.
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        applyLanguage(currentLanguage, false);

        const toggle = document.getElementById('languageToggle');
        if (!toggle) return;

        toggle.addEventListener('click', () => {
            applyLanguage(currentLanguage === 'zh-CN' ? 'en' : 'zh-CN', true);
        });
    }, { once: true });
})();
