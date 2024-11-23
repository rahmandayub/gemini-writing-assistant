'use client';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Languages, Copy, Check, X } from 'lucide-react';

type LanguageCode =
    | 'en'
    | 'ja'
    | 'ko'
    | 'ar'
    | 'id'
    | 'bn'
    | 'bg'
    | 'zh'
    | 'hr'
    | 'cs'
    | 'da'
    | 'nl'
    | 'et'
    | 'fa'
    | 'fi'
    | 'fr'
    | 'de'
    | 'gu'
    | 'el'
    | 'he'
    | 'hi'
    | 'hu'
    | 'it'
    | 'kn'
    | 'lv'
    | 'lt'
    | 'ml'
    | 'mr'
    | 'no'
    | 'pl'
    | 'pt'
    | 'ro'
    | 'ru'
    | 'sr'
    | 'sk'
    | 'sl'
    | 'es'
    | 'sw'
    | 'sv'
    | 'ta'
    | 'te'
    | 'th'
    | 'tr'
    | 'uk'
    | 'ur'
    | 'vi';

type LanguageInfo = {
    name: string;
    native: string;
};

// This would normally be imported from countries-list
// For demo purposes, including a subset of languages here
const LANGUAGES: Record<LanguageCode, LanguageInfo> = {
    en: { name: 'English', native: 'English' },
    ja: { name: 'Japanese', native: '日本語' },
    ko: { name: 'Korean', native: '한국어' },
    ar: { name: 'Arabic', native: 'العربية' },
    id: { name: 'Bahasa Indonesia', native: 'Bahasa Indonesia' },
    bn: { name: 'Bengali', native: 'বাংলা' },
    bg: { name: 'Bulgarian', native: 'Български' },
    zh: { name: 'Chinese', native: '中文' },
    hr: { name: 'Croatian', native: 'Hrvatski' },
    cs: { name: 'Czech', native: 'Čeština' },
    da: { name: 'Danish', native: 'Dansk' },
    nl: { name: 'Dutch', native: 'Nederlands' },
    et: { name: 'Estonian', native: 'Eesti' },
    fa: { name: 'Farsi', native: 'فارسی' },
    fi: { name: 'Finnish', native: 'Suomi' },
    fr: { name: 'French', native: 'Français' },
    de: { name: 'German', native: 'Deutsch' },
    gu: { name: 'Gujarati', native: 'ગુજરાતી' },
    el: { name: 'Greek', native: 'Ελληνικά' },
    he: { name: 'Hebrew', native: 'עברית' },
    hi: { name: 'Hindi', native: 'हिन्दी' },
    hu: { name: 'Hungarian', native: 'Magyar' },
    it: { name: 'Italian', native: 'Italiano' },
    kn: { name: 'Kannada', native: 'ಕನ್ನಡ' },
    lv: { name: 'Latvian', native: 'Latviešu' },
    lt: { name: 'Lithuanian', native: 'Lietuvių' },
    ml: { name: 'Malayalam', native: 'മലയാളം' },
    mr: { name: 'Marathi', native: 'मराठी' },
    no: { name: 'Norwegian', native: 'Norsk' },
    pl: { name: 'Polish', native: 'Polski' },
    pt: { name: 'Portuguese', native: 'Português' },
    ro: { name: 'Romanian', native: 'Română' },
    ru: { name: 'Russian', native: 'Русский' },
    sr: { name: 'Serbian', native: 'Српски' },
    sk: { name: 'Slovak', native: 'Slovenčina' },
    sl: { name: 'Slovenian', native: 'Slovenščina' },
    es: { name: 'Spanish', native: 'Español' },
    sw: { name: 'Swahili', native: 'Kiswahili' },
    sv: { name: 'Swedish', native: 'Svenska' },
    ta: { name: 'Tamil', native: 'தமிழ்' },
    te: { name: 'Telugu', native: 'తెలుగు' },
    th: { name: 'Thai', native: 'ไทย' },
    tr: { name: 'Turkish', native: 'Türkçe' },
    uk: { name: 'Ukrainian', native: 'Українська' },
    ur: { name: 'Urdu', native: 'اردو' },
    vi: { name: 'Vietnamese', native: 'Tiếng Việt' },
};

type Mode = 'Paraphrase' | 'Translate';
type Style =
    | 'Casual'
    | 'Formal'
    | 'Professional'
    | 'Creative'
    | 'Humorous'
    | 'Academic'
    | 'Technical'
    | 'Conversational';

export default function Home() {
    const [mode, setMode] = useState<Mode>('Translate');
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [targetLang, setTargetLang] = useState<LanguageCode>('en');
    const [sourceLang, setSourceLang] = useState<LanguageCode | 'auto'>('auto');
    const [style, setStyle] = useState<Style>('Formal');
    const [copied, setCopied] = useState(false);
    const [charCount, setCharCount] = useState(0);
    const [isStreaming, setIsStreaming] = useState(false);

    const abortControllerRef = useRef<AbortController | null>(null);
    const styles: Style[] = [
        'Casual',
        'Formal',
        'Professional',
        'Creative',
        'Humorous',
        'Academic',
        'Technical',
        'Conversational',
    ];

    // Handle mode change with proper language synchronization
    const handleModeChange = (newMode: Mode) => {
        setMode(newMode);
        if (newMode === 'Paraphrase') {
            setTargetLang(sourceLang === 'auto' ? 'en' : sourceLang);
        }
    };

    // Handle source language change with mode-aware behavior
    const handleSourceLanguageChange = (newLang: string) => {
        const typedLang = newLang as LanguageCode | 'auto';
        setSourceLang(typedLang);

        if (mode === 'Paraphrase' && newLang !== 'auto') {
            setTargetLang(newLang as LanguageCode);
        }
    };

    // Handle target language change
    const handleTargetLanguageChange = (newLang: string) => {
        if (mode === 'Translate') {
            setTargetLang(newLang as LanguageCode);
        }
    };

    // Effect to maintain language synchronization
    useEffect(() => {
        if (mode === 'Paraphrase' && sourceLang !== 'auto') {
            setTargetLang(sourceLang);
        }
    }, [mode, sourceLang]);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        setInput(text);
        setCharCount(text.length);
    };

    const handleProcess = async () => {
        try {
            setLoading(true);
            setIsStreaming(true);
            setError('');
            setResult('');

            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            const effectiveTargetLang =
                mode === 'Paraphrase'
                    ? sourceLang === 'auto'
                        ? 'en'
                        : sourceLang
                    : targetLang;

            const response = await fetch('/api/paraphrase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: input,
                    sourceLang,
                    targetLang: effectiveTargetLang,
                    style,
                    mode,
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                throw new Error('Failed to process');
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No reader available');
            }

            const decoder = new TextDecoder();
            let buffer = '';
            let streamedText = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    setIsStreaming(false);
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('data: ')) {
                        const data = trimmedLine.slice(6);
                        if (data === '[DONE]') {
                            setIsStreaming(false);
                            return;
                        }
                        streamedText += data;
                        setResult(streamedText);
                    }
                }
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('Request aborted');
            } else {
                setError('Failed to process text');
                console.error('Error:', error);
            }
        } finally {
            setLoading(false);
            setIsStreaming(false);
        }
    };

    const handleClear = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setInput('');
        setResult('');
        setError('');
        setCharCount(0);
        setLoading(false);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(result);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto p-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-semibold text-gray-800">
                        AI Writing Assistant
                    </h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleModeChange('Translate')}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                mode === 'Translate'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'hover:bg-gray-100'
                            }`}
                        >
                            Translate
                        </button>
                        <button
                            onClick={() => handleModeChange('Paraphrase')}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                mode === 'Paraphrase'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'hover:bg-gray-100'
                            }`}
                        >
                            Paraphrase
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white rounded-xl shadow-sm border">
                    {/* Input Section */}
                    <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <select
                                className="text-sm text-gray-600 bg-transparent focus:outline-none cursor-pointer hover:bg-gray-50 p-1 rounded"
                                value={sourceLang}
                                onChange={(e) =>
                                    handleSourceLanguageChange(e.target.value)
                                }
                                disabled={loading}
                            >
                                <option value="auto">Detect Language</option>
                                {Object.entries(LANGUAGES).map(
                                    ([code, lang]) => (
                                        <option key={code} value={code}>
                                            {lang.name} ({lang.native})
                                        </option>
                                    )
                                )}
                            </select>
                            {input && (
                                <button
                                    onClick={handleClear}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X size={16} className="text-gray-400" />
                                </button>
                            )}
                        </div>
                        <textarea
                            placeholder="Enter text"
                            className="w-full px-2 h-48 resize-none bg-transparent placeholder-gray-400 focus:outline-none text-gray-700"
                            value={input}
                            onChange={handleInputChange}
                            disabled={loading}
                        />
                        <div className="flex justify-end mt-2">
                            <span className="text-sm text-gray-400">
                                {charCount} characters
                            </span>
                        </div>
                    </div>

                    {/* Output Section */}
                    <div className="p-6 relative">
                        <div className="flex justify-between items-center mb-4">
                            {mode === 'Translate' ? (
                                <select
                                    className="text-sm text-gray-600 bg-transparent focus:outline-none cursor-pointer hover:bg-gray-50 p-1 rounded"
                                    value={targetLang}
                                    onChange={(e) =>
                                        handleTargetLanguageChange(
                                            e.target.value
                                        )
                                    }
                                    disabled={loading}
                                >
                                    {Object.entries(LANGUAGES).map(
                                        ([code, lang]) => (
                                            <option key={code} value={code}>
                                                {lang.name} ({lang.native})
                                            </option>
                                        )
                                    )}
                                </select>
                            ) : (
                                <div className="text-sm text-gray-600">
                                    Output Language:{' '}
                                    {sourceLang !== 'auto' &&
                                    LANGUAGES[sourceLang]
                                        ? LANGUAGES[sourceLang].name
                                        : 'English'}
                                </div>
                            )}
                            {result && (
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1 px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                    {copied ? (
                                        <Check
                                            size={16}
                                            className="text-green-500"
                                        />
                                    ) : (
                                        <Copy size={16} />
                                    )}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            )}
                        </div>
                        <div className="h-48 px-2 text-gray-700 overflow-y-auto">
                            {error ? (
                                <div className="text-red-500">{error}</div>
                            ) : (
                                <div className="relative">
                                    <ReactMarkdown>{result}</ReactMarkdown>
                                    {isStreaming && (
                                        <span className="inline-block w-1 h-4 ml-1 bg-blue-500 animate-pulse" />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Controls Section */}
                <div className="mt-4 space-y-4">
                    <div className="p-4 bg-white rounded-lg border">
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">
                                Style:
                            </span>
                            <div className="flex gap-2">
                                {styles.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setStyle(s)}
                                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                                            style === s
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'hover:bg-gray-100'
                                        }`}
                                        disabled={loading}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleProcess}
                        disabled={loading || !input}
                        className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-blue-300 transition-colors flex items-center justify-center gap-2"
                    >
                        {isStreaming ? (
                            'Processing...'
                        ) : (
                            <>
                                <Languages size={20} />
                                {mode === 'Translate'
                                    ? 'Translate'
                                    : 'Paraphrase'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
