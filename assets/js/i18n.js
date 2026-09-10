(function () {
    'use strict';

    const STORAGE_KEY = 'abysslasea-language';
    const DEFAULT_LANGUAGE = 'zh-CN';
    const translations = {
        'zh-CN': {
            'meta.title': 'AbyssLasea 个人主页',
            'meta.description': 'AbyssLasea 的个人主页。',
            'desktop-title': '首页',
            'nav.label': '个人主页链接',
            'mountain.label': '暮色中的层叠雪山',
            'hero.intro': '你好！我是',
            'scroll.label': '继续向下浏览',
            'scroll.text': '下滑',
            'window.dragHome': '拖动首页窗口',
            'window.resetHome': '还原首页窗口位置',
            'window.dragAbout': '拖动关于窗口',
            'window.resetAbout': '还原关于窗口位置',
            'window.closeAbout': '关闭关于窗口',
            'window.dragWork': '拖动作品窗口',
            'window.resetWork': '还原作品窗口位置',
            'window.closeWork': '关闭作品窗口',
            'window.dragContact': '拖动联系方式窗口',
            'window.resetContact': '还原联系方式窗口位置',
            'window.closeContact': '关闭联系方式窗口',
            'home.greeting': 'hi! i\'m',
            'home.role': '游戏开发者以及绘画新手',
            'home.navLabel': '首页导航',
            'home.about': '关于',
            'home.links': '链接',
            'home.work': '作品',
            'home.faq': 'FAQ',
            'home.contact': '联系方式',
            'contact.windowTitle': '联系方式',
            'contact.heading': '呀呼！来信了！',
            'contact.body': '我基本上很少会查看社交媒体的私信（除了QQ），因此通过邮件向我提问是最好的方法，欢迎发邮件',
            'contact.emailLead': '给我发邮件：',
            'about.windowTitle': '关于',
            'about.name': '徐修昊',
            'about.summary': '中国的游戏开发者，目前仍处于学生状态',
            'about.detailsTitle': '详细介绍',
            'about.detailsIntro': '嗨！我是Lasea(网名同时也是我的OC名)，一名游戏开发者。我...',
            'about.makesGames': '制作"游戏"',
            'about.makesSoftware': '制作奇奇怪怪的软件(玩具)',
            'about.makesArt': '绘制时尚小垃圾(涂鸦)',
            'about.contactLead': '如果你找我有事情亦或者想与我合作请发送邮件至',
            'about.contactTail': ':)',
            'about.interestsTitle': '兴趣！',
            'about.interestGameDev': '游戏开发',
            'about.interestMusic': '音乐！',
            'about.interestIndie': '试玩各种独立游戏',
            'about.interestSplatoon': 'Splatoon系列',
            'about.interestPokemon': 'Pokemon系列',
            'about.interestArts': '以及大部分艺类活动',
            'about.languageTitle': '语言',
            'about.languageBody': '我的母语是Chinese/中文，我的其他外语能力很烂，所以如果你以其他语言与我交流我很可能会使用机器翻译...',
            'work.windowTitle': '作品',
            'work.inviteLead': '如果你有想实现的Unity mod亦或者是Minecraft mod欢迎',
            'work.inviteMail': '前往我的邮箱邀约',
            'work.toolsTitle': '工具',
            'work.gamesTitle': '游戏',
            'work.threeCoverAlt': 'Three 🐰 one 的游戏封面',
            'work.tightropeCoverAlt': 'Tightrope Deathmatch 的游戏封面',
            'about.kicker': '关于我',
            'about.greeting': '你好，我是',
            'about.lead': '自称是 Game Developer 的人。',
            'about.body': '我制作 Game Mod 和一些 Mini Game，最近正在使用 Godot 引擎制作 3D Game。多多期待！',
            'about.linkLabel': '访问XuXiuHao的 Bilibili 主页',
            'about.avatarAlt': 'XuXiuHao的头像',
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
            'desktop-title': 'Home',
            'nav.label': 'Profile links',
            'mountain.label': 'Layered snowy mountains at dusk',
            'hero.intro': "hi! i'm",
            'scroll.label': 'Continue scrolling',
            'scroll.text': 'SCROLL',
            'window.dragHome': 'Drag the home window',
            'window.resetHome': 'Reset the home window position',
            'window.dragAbout': 'Drag the about window',
            'window.resetAbout': 'Reset the about window position',
            'window.closeAbout': 'Close the about window',
            'window.dragWork': 'Drag the work window',
            'window.resetWork': 'Reset the work window position',
            'window.closeWork': 'Close the work window',
            'window.dragContact': 'Drag the contact window',
            'window.resetContact': 'Reset the contact window position',
            'window.closeContact': 'Close the contact window',
            'home.greeting': "hi! i\'m",
            'home.role': 'Game Developer and beginner artist',
            'home.navLabel': 'Home navigation',
            'home.about': 'About',
            'home.links': 'Links',
            'home.work': 'Work',
            'home.faq': 'FAQ',
            'home.contact': 'Contact',
            'contact.windowTitle': 'Contact',
            'contact.heading': 'Yay! A letter!',
            'contact.body': 'I rarely check direct messages on social media (except QQ), so email is the best way to ask me something. Feel free to write!',
            'contact.emailLead': 'Email me: ',
            'about.windowTitle': 'About',
            'about.name': 'Xiuhao Xu',
            'about.summary': 'A game developer from China who is currently still a student.',
            'about.detailsTitle': 'Details',
            'about.detailsIntro': "Hi! I'm Lasea (my online name and also the name of my OC), a game developer. I...",
            'about.makesGames': 'make "games"',
            'about.makesSoftware': 'make strange little programs (toys)',
            'about.makesArt': 'draw fashionable little pieces of trash (doodles)',
            'about.contactLead': 'If you need to reach me or would like to work with me, please email',
            'about.contactTail': ':)',
            'about.interestsTitle': 'Interests!',
            'about.interestGameDev': 'Game development',
            'about.interestMusic': 'Music!',
            'about.interestIndie': 'Trying all kinds of indie games',
            'about.interestSplatoon': 'The Splatoon series',
            'about.interestPokemon': 'The Pokemon series',
            'about.interestArts': 'And most kinds of art-related activities',
            'about.languageTitle': 'Languages',
            'about.languageBody': "My native language is Chinese/中文. I'm terrible at other languages, so if you talk to me in another language, I will probably use machine translation...",
            'work.windowTitle': 'Work',
            'work.inviteLead': 'If you have a Unity mod or Minecraft mod idea that you would like to make real, feel free to',
            'work.inviteMail': 'contact me by email',
            'work.toolsTitle': 'Tools',
            'work.gamesTitle': 'Games',
            'work.threeCoverAlt': 'Cover art for Three 🐰 one',
            'work.tightropeCoverAlt': 'Cover art for Tightrope Deathmatch',
            'about.kicker': 'ABOUT ME',
            'about.greeting': "Hi, I'm",
            'about.lead': 'A self-proclaimed game developer.',
            'about.body': 'I make game mods and small games. Recently, I have been building a 3D game with Godot. Stay tuned!',
            'about.linkLabel': "Visit Xiuhao Xu's Bilibili profile",
            'about.avatarAlt': "Xiuhao Xu's avatar",
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
